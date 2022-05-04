'use strict';

var path = require('path');
const outputPath = path.resolve(__dirname, 'dist');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const isProduction = process.env.NODE_ENV == "production";


function _externals() {
  let manifest = require('./package.json');
  let dependencies = manifest.dependencies;
  let externals = {};
  for (let p in dependencies) {
    externals[p] = 'commonjs ' + p;
  }
  return externals;
}

const config = {
  entry: './preload.js',
  externals: _externals(),
  target: 'node',
  output: {
    path: outputPath,
    filename: 'preload.js'
  },
  plugins: [
    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
    new CopyWebpackPlugin({
      patterns: [{
        from: './public/*',
        to: outputPath
      }, {
        from: './plugin.json',
        to: outputPath
      }, {
        from: './logo/logo.png',
        to: outputPath
      }]
    })
  ],
  node: {
    __dirname: true
  },
  module: {
    rules: [{
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', {
              "targets": {
                "node": true
              }
            }]
          ]
        }
      },
      test: /\.js$/,
      exclude: /node_modules/
    }]
  },
  optimization: {
    minimize: true
  }
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
