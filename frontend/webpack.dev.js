const {merge} = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

const host = 'localhost';
const port = 3000;

module.exports = merge(common, {
    mode: 'development',

    devtool: 'inline-source-map',

    devServer: {
        host,
        port,
        compress: false,
        client: {
            overlay: false,
            webSocketURL: 'ws://0.0.0.0:0/ws',
        },
        historyApiFallback: true,
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        hot: true,
    },
    optimization: {
        runtimeChunk: 'single',
    },
});
