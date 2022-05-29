import axios from 'axios';
class MediaChunkPlayer {
    constructor(method, url, mime) {
        this.method = method;
        this.url = url;
        this.body = '';
        this.headers = {};
        this.mime = mime || 'audio/mpeg';
        this.mediaSource = null;
        this.sourceBuffer = null;
        this.downloaded = false;
        this.reader = null;
        this.onError = null;
        this.onLoad = null;
        this.onProgress = null;
        this.buffers = [];
        this.bufferBlobUrl = '';
        this.isSupportDownload = false;
        this.fetchTotal = 0;
        this.total = 0;
        this.setMedia(null);
    }
    setMethod(method) {
        this.method = method;
    }
    setUrl(url) {
        this.url = url;
    }
    setMime(mime) {
        this.mime = mime;
    }
    setMedia(media) {
        if (media) {
            this.media = media;
            return;
        }
        // else create an default audio element
        this.media = new Audio();
        this.media.addEventListener("canplaythrough", event => {
          this.media.play();
        });
        this.media.type = this.mime;
    }
    toggleEnableDownload() {
        this.isSupportDownload = !this.isSupportDownload;
    }
    play(body, headers) {
        this.headers = headers || {};
        if (this.body != body) {
            this.body = body;
            this.loadFile();
        } else {
            this.media.currentTime = 0;
            this.media.pause();
            this.media.play();
        }
    }
    loadFile() {
        this.fetchTotal = 0;
        this.total = 0;
        this.downloaded = false;
        this.buffers = [];
        if (this.bufferBlobUrl) {
            URL.revokeObjectURL(this.bufferBlobUrl);
            this.bufferBlobUrl = '';
        } else if (this.media.src) {
            URL.revokeObjectURL(this.media.src);
        }
        if (this.isSupportMediaSourceStream()) {
            this.loadFileFetch();
            return;
        }
        this.loadFileByAxios();
    }
    isSupportMediaSourceStream() {
        return window.MediaSource && window.fetch;
    }
    setErrorCallback(cb) {
        this.onError = cb
    }
    setLoadCallback(cb) {
        this.onLoad = cb
    }
    setProgressCallback(cb) {
        this.onProgress = cb
    }
    loadFileByAxios() {
        let form = {
            url: this.url,
            method: this.method.toUpperCase(),
            headers: this.headers,
            responseType: 'blob'
        };
        if (this.onProgress) {
            form.onDownloadProgress = this.onProgress;
        }
        if (form.method == 'POST' || form.method == 'PUT') {
            form.data = this.body;
        }
        axios.request(form).then((response) => {
            this.media.src = URL.createObjectURL(response.data);
            if (this.onLoad) {
                this.onLoad();
            }
        }).catch((err) => {
            if (this.onError) {
                this.onError(err);
            }
            return err;
        })
    }
    loadFileFetch() {
        this.mediaSource = new window.MediaSource();

        this.media.src = URL.createObjectURL(this.mediaSource);
        this.mediaSource.addEventListener('sourceopen', () => {
            this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mime);
            this.addSourceBufferEvent()
            this.fetchFile();
        });
    }
    read() {
        return this.reader.read().then(({ value, done }) => {
            if (done) {
                this.downloaded = true;
                this.mediaSource.endOfStream();
                if (this.onLoad) {
                    this.onLoad();
                }
                return;
            }
            if (this.isSupportDownload) {
                this.buffers.push(value.buffer);
            }
            if (this.onProgress) {
                this.fetchTotal = this.fetchTotal + value.length
                this.onProgress(new ProgressEvent('progress', {
                    lengthComputable: false,
                    loaded: this.fetchTotal,
                    total: this.total
                }));
            }
            this.sourceBuffer.appendBuffer(value.buffer);
        });
    }
    fetchFile() {
        let form = {
            method: this.method.toUpperCase(),
            headers: this.headers
        };
        if (form.method == 'POST' || form.method == 'PUT') {
            form.body = this.body;
        }
        return fetch(this.url, form).then((response) => {
            this.total = response.headers.get('Content-Length');
            this.reader = response.body.getReader();
            this.read();
            return response;
        }).catch((err) => {
            if (this.onError) {
                this.onError(err);
            }
            return err;
        });
    }
    addSourceBufferEvent() {
        this.sourceBuffer.addEventListener('updateend',  (e) => {
            if (this.downloaded) {
                this.mediaSource.endOfStream();
                return;
            }
            if (!this.sourceBuffer.updating && this.mediaSource.readyState === 'open') {
                this.read()
            }
        });
    }
    download(filename) {
        if (!this.isSupportDownload) {
            return;
        }
        let blobUrl = this.media.src;
        if (this.bufferBlobUrl) {
            blobUrl = this.bufferBlobUrl;
        } else if (this.buffers.length > 0) {
            let bufferBlob = new Blob(this.buffers, { type: this.mime });
            blobUrl = URL.createObjectURL(bufferBlob);
            this.bufferBlobUrl = blobUrl;
        }
        if (typeof window.navigator.msSaveOrOpenBlob !== 'undefined') {
            // IE doesn't allow using a blob object directly as link href.
            // Workaround for "HTML7007: One or more blob URLs were
            // revoked by closing the blob for which they were created.
            // These URLs will no longer resolve as the data backing
            // the URL has been freed."
            window.navigator.msSaveOrOpenBlob(blobUrl, filename);
            return;
        }
        // Other browsers
        // Create a link pointing to the ObjectURL containing the blob
        const tempLink = document.createElement('a');
        tempLink.style.display = 'none';
        tempLink.href = blobUrl;
        tempLink.setAttribute('download', filename);
        // Safari thinks _blank anchor are pop ups. We only want to set _blank
        // target if the browser does not support the HTML5 download attribute.
        // This allows you to download files in desktop safari if pop up blocking
        // is enabled.
        if (typeof tempLink.download === 'undefined') {
            tempLink.setAttribute('target', '_blank');
        }
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
    }
}

window.MediaChunkPlayer = MediaChunkPlayer;
export default MediaChunkPlayer;
