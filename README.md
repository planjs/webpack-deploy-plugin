# webpack-deploy-plugin

![npm](https://img.shields.io/npm/v/@planjs/webpack-deploy-plugin?label=latest)
[![test](https://github.com/planjs/webpack-deploy-plugin/actions/workflows/test.yml/badge.svg)](https://github.com/planjs/webpack-deploy-plugin/actions/workflows/test.yml)

## Install

Using npm:

```console
npm install @planjs/webpack-deploy-plugin --save-dev
```

## Usage

`webpack.Stats` All output content will be uploaded to the server, or oss.
**webpack.config.js**
```js
const WebpackDeployPlugin = require('@planjs/webpack-deploy-plugin')

module.exports = {
    plugins: [
      new WebpackDeployPlugin({
        targets: {
          oss: {
            type: 'oss',
            // oss deploy folder
            dest: '/app/test1/',
            patterns: ['**', '!**.js.map'],
            OSSUploadOptions: {
              type: 'COS',
              COSOptions: {
                SecretId: 'xxx',
                SecretKey: 'xxx'
              },
              uploadParams: {
                Bucket: 'xxx',
                Region: 'xxx'
              }
            }
          },
          rsync: {
            type: 'rsync',
            patterns: ['**', '!**.js.map'],
            dest: 'root@xx.xx.xx.xx:/www/deploy folder'
          }
        },
        // The key of the `targets` used
        env: 'oss'
      })
    ]
};
```

## Options

### `targets`
Upload configuration collection.   
Type: `Record<any, TargetItem> | TargetItem`

### `env`
If there are multiple upload configurations, it will be switched according to this as the key.   
Type: `string`

## TargetItem

### `type`
Type: `rsync | oss`   
How to upload files.

### `dest`
Upload to server folder.
> `type oss` folder default `''`   
> `type rsync` server connection string `root@xx.xx.xx.xx:/www/deploy folder`

Type: `string`

### `patterns`
Type: `string | string[]` [multimatch](https://www.npmjs.com/package/multimatch)   
The paths to match against will be uploaded.   

### `rsyncOptions`
Rsync args.   
Type: `{ args: string[][] }`   
> eg: `['bwlimit', 10]` [rsync](https://linux.die.net/man/1/rsync)   
> Detailed reference [node-rsync](https://github.com/mattijs/node-rsync)

### `OSSUploadOptions`
Type: `object` 
> Detailed reference [oss-upload-tool](https://github.com/planjs/stan/tree/master/packages/oss-upload-tool)

### `onUploadFinish`
Type: `(stats: Stats) => void | Promise<void>`   
Upload complete event.
