const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const sourceMapsDisabled = false;
const sourceMapsToken = '';

module.exports = {
    target: 'web',
    mode: 'production',
    devtool: 'source-map',
    entry: {
        'index': './src/index.tsx',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].min.js',
        clean: true
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./template.html",
            title: "dataset site"
        })
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
        fallback: {
            fs: false,
        },
        alias: {
            react: '@modules/react',
            '@root': path.resolve(__dirname, 'src'),
            '@modules': path.resolve(__dirname, 'node_modules'),
        },
        modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            '@babel/plugin-proposal-optional-chaining',
                            '@babel/plugin-transform-private-methods',
                            [
                                'import',
                                {
                                    libraryName: 'antd',
                                },
                            ],
                        ],
                        presets: ['@babel/preset-env', '@babel/preset-react', '@babel/typescript'],
                        sourceType: 'unambiguous',
                    },
                },
            },
            {
                test: /\.(css|scss)$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 2,
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    [
                                        'postcss-preset-env', {},
                                    ],
                                ],
                            },
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sassOptions: {
                                // Suppress deprecation warnings from dependencies (e.g., node_modules)
                                quietDeps: true, //

                                // Suppress specific types of deprecation warnings globally
                                silenceDeprecations: ['import'],

                                // Optionally, silence all warnings using a custom logger
                                // logger: {
                                //   warn: () => null,
                                //   debug: () => null
                                // }
                            },
                        },
                    },
                ],
            },
            {
                test: /\.svg$/,
                exclude: /node_modules/,
                use: [
                    'babel-loader',
                    {
                        loader: 'react-svg-loader',
                        options: {
                            svgo: {
                                plugins: [{ pretty: true }, { cleanupIDs: false }],
                            },
                        },
                    },
                ],
            },
            {
                test: /\.(png|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ],
        parser: {
            javascript: {
                exportsPresence: 'error',
            },
        },
    },
}
