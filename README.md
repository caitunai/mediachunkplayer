# MediaChunkPlayer
play media from chunk response

## Install
### With npm or Webpack
```shell
npm install --save @caitun/mediachunkplayer
```

### With script tag
```html
<script src="https://unpkg.com/@caitun/mediachunkplayer/dist/player.dist.js"></script>
```

## How to use?
### In the browser
```javascript
var url = 'audio.mp3';
var player = new MediaChunkPlayer('GET', url);
player.setErrorCallback(function(err) {
    console.error(err, err.message);
})
```

### Within a es6 module
```javascript
import MediaChunkPlayer from '@caitun/mediachunkplayer';

const url = 'audio.mp3';
const player = new MediaChunkPlayer('GET', url);
player.setErrorCallback(function(err) {
    console.error(err, err.message);
})
```
