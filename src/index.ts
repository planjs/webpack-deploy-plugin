import path from "path";
import type { Compiler } from "webpack";
import { WebpackError } from "webpack";
import { ossUpload, OSSUploadOptions } from "oss-upload-tool";
import multimatch from "multimatch";

import rsync from "./rsync";

const pluginName = "WebpackDeployPlugin";

type TargetItem = {
  type?: "rsync" | "oss";
  /**
   * Upload file to directory
   */
  dest: string;
  /**
   * Match which files can be uploaded
   * eg: HOMEDIR/project/dist/bundle.js
   *     upload **\/bundle.js
   *     filter !**\/bundle.js
   * @see https://github.com/sindresorhus/multimatch
   */
  patterns?: string | string[];
  /**
   * @see https://linux.die.net/man/1/rsync
   */
  rsyncOptions?: {
    /**
     * Rsync args
     * @see https://github.com/mattijs/node-rsync
     * eg: ['bwlimit', 10]
     */
    args?: [string, string?][];
  };
  ossUploadOptions?: OSSUploadOptions;
  /**
   * Upload finish callback
   */
  onUploadFinish?: () => void;
};

type WebpackDeployPluginOptions = {
  /**
   * Upload related configuration
   * If configured as an object, the key is the environment, and the value is the upload configuration
   */
  targets: Record<any, TargetItem> | TargetItem;
  /**
   * If there are multiple configurations, it is the key of the corresponding environment
   */
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
      const { compilation } = stats;

      if (!this.target) {
        compilation.errors.push(logWithError("Missing upload configuration."));
        return;
      }

      const {
        type,
        rsyncOptions,
        ossUploadOptions,
        dest,
        patterns = "**",
        onUploadFinish,
      } = this.target;

      const assets = multimatch(
        Object.keys(stats.compilation.assets).map((f) =>
          path.join(outputDir, f)
        ),
        patterns
      );

      if (!assets.length) {
        compilation.errors.push(logWithError("No files to upload."));
        return;
      }

      if (type === "rsync") {
        await rsync(assets, dest, rsyncOptions?.args);
      } else if (type === "oss") {
        await ossUpload({
          cwd: outputDir,
          ...ossUploadOptions,
          targets: {
            dest: dest,
            ...ossUploadOptions.targets,
            src: assets,
          },
        });
      } else {
        compilation.errors.push(
          logWithError("Upload only supports rsync and oss.")
        );
        return;
      }

      onUploadFinish?.();

      log("Uploaded successfully.");
    });
  };

  get target(): TargetItem {
    const { env, targets } = this.options || {};
    if (!targets) return;
    if (env in targets) {
      return targets[env];
    }
    return targets as TargetItem;
  }
}

const logPrefix = `[${pluginName}] `;

function log(...rest) {
  return console.log.call(null, logPrefix, ...rest);
}

function logWithError(str: string) {
  log(str);
  return new WebpackError(`${logPrefix}${str}`);
}

module.exports = WebpackDeployPlugin;
