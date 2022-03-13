import type { Compiler } from "webpack";
import { ossUpload, OSSUploadOptions } from "oss-upload-tool";

const pluginName = "WebpackDeployPlugin";

type TargetItem = {
  type?: "rsync" | "oss";
  rsyncOptions?: any;
  ossUploadOptions?: OSSUploadOptions;
};

type WebpackDeployPluginOptions = {
  targets: Record<any, TargetItem> | TargetItem;
};

class WebpackDeployPlugin {
  name = pluginName;

  options: WebpackDeployPluginOptions;

  constructor(options: WebpackDeployPluginOptions) {
    this.options = options;
  }

  apply(compiler: Compiler) {
    const {
      output: { path: outputDir },
      context,
      mode,
    } = compiler.options;
    console.log(context, mode, outputDir);
    compiler.hooks.done.tapPromise(this.name, () => {
      return new Promise((resolve, reject) => {
        resolve();
      });
    });
  }
}

export default WebpackDeployPlugin;
