# webpack-deploy-plugin

![npm](https://img.shields.io/npm/v/@planjs/webpack-deploy-plugin?label=latest)
[![test](https://github.com/planjs/webpack-deploy-plugin/actions/workflows/test.yml/badge.svg)](https://github.com/planjs/webpack-deploy-plugin/actions/workflows/test.yml)

> The plugin currently only supports `rsync` and `oss-upload-tool`. If it is rsync, you need to confirm whether the environment supports rsync.

## Install

Using npm:

```console
npm install @planjs/webpack-deploy-plugin --save-dev
```

Using yarn:

```console
yarn add @planjs/webpack-deploy-plugin -D
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
Paths based on `compilation.assets` or `output` folder matching will be uploaded.

### `isUploadOutputDir`
Type: `boolean`  
Default: `false`
By default, the file of `compilation.assets` is used, and when it is turned on, all the output folders will be uploaded.

### `rsyncOptions`
Rsync args.   
Type: `{ args: string[][] }`   
> eg: `['bwlimit', 10]` [rsync](https://linux.die.net/man/1/rsync)   

### `OSSUploadOptions`
Type: `object` 
> Detailed reference [oss-upload-tool](https://github.com/planjs/stan/tree/master/packages/oss-upload-tool)   
> It also supports related environment variable configuration.

### `maxAttempts`
Type: `number`      
Maximum number of failed retries.   
Only valid for `oss-upload-tool`, `rsync` does not need to retry.   

### `timeout`
Type: `number`      
Execution timeout.   
If it is `rsync`, it is the timeout period for executing the command. If it is `oss-upload-tool`, it is the single file upload timeout period.  

### `onUploadStart`
Type: `(stats: Stats, shelljs) => void | Promise<void>`   
Before upload event.

### `onUploadFinish`
Type: `(stats: Stats, shelljs) => void | Promise<void>`   
Upload complete event.

### `execUploadStartScripts`
Type: `string[][] | string[]`   
before Upload start exec script.
> Detailed reference [execa](https://github.com/sindresorhus/execa)

### `execUploadFinishScripts`
Type: `string[][] | string[]`   
before Upload finish exec script.
> Detailed reference [execa](https://github.com/sindresorhus/execa)

## FQA
### Window Rsync error: `The command line is too long`
By default, window will use 8191 as the longest length, leave 100 for other parameters, and if the remaining length is too long, it will become multiple rsync commands.   
If it still fails, it may be an environment problem, change the cutting rules through the variable `MAX_COMMAND_LINE_LIMIT`.

## License

MIT © [fupengl](https://github.com/fupengl)
