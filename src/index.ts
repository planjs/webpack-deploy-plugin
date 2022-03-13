import path from "path";
import type { Compiler } from "webpack";
import { ossUpload, OSSUploadOptions } from "oss-upload-tool";
import rsync from "./rsync";

const pluginName = "WebpackDeployPlugin";

type TargetItem = {
  type?: "rsync" | "oss";
  rsyncOptions?: {
    destination: string;
    exclude?: string | string[];
  };
  ossUploadOptions?: OSSUploadOptions;
};

type WebpackDeployPluginOptions = {
  targets: Record<any, TargetItem> | TargetItem;
  env?: string;
};

class WebpackDeployPlugin {
  name = pluginName;

  options: WebpackDeployPluginOptions;

  constructor(options: WebpackDeployPluginOptions) {
    this.options = options;
  }

  apply = (compiler: Compiler) => {
    const {
      output: { path: outputDir },
    } = compiler.options;
    compiler.hooks.done.tapPromise(this.name, async (stats) => {
      const assets = Object.keys(stats.compilation.assets).map((f) =>
        path.join(outputDir, f)
      );
      if (this.target.type === "rsync") {
        await rsync(assets, "./dist/");
      }
    });
  };

  get target(): TargetItem {
    const { env, targets } = this.options || {};
    if (env && env in targets) {
      return targets[env];
    }
    return targets;
  }
}

export default WebpackDeployPlugin;
