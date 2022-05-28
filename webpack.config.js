const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'production',
    target: 'web',
    entry: './index.js',
    devtool: false,
    output: {
        filename: 'player.dist.js',
    },
    plugins: [
        new webpack.SourceMapDevToolPlugin({
            filename: 'player.dist.map',
        })
    ],
    module: {
        rules: [
            {
                test: require.resolve("axios"),
                loader: "expose-loader",
                options: {
                    exposes: ["axios"],
                },
            }
        ]
    }
};
