import { WebpackError } from "webpack";
import type { Compiler, Stats } from "webpack";
import { ossUpload, OSSUploadOptions } from "oss-upload-tool";
import multimatch from "multimatch";
import { validate } from "schema-utils";
import execa from "execa";

import rsync from "./rsync";
import { pluginName, logPrefix } from "./const";
const schema = require("./options.json");

export type TargetItem = {
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
  OSSUploadOptions?: OSSUploadOptions;
  /**
   * Maximum number of failed retries
   * @default 0
   */
  maxAttempts?: number;
  /**
   * Execution timeout
   */
  timeout?: number;
  /**
   * Executed when upload starts
   * cwd: webpack work dir
   */
  execUploadStartScripts?: string[][] | string[];
  /**
   * Executed when upload finish
   * cwd: webpack work dir
   */
  execUploadFinishScripts?: string[][] | string[];
  /**
   * before upload callback
   */
  onUploadStart?: (stats: Stats) => void | Promise<void>;
  /**
   * Upload finish callback
   */
  onUploadFinish?: (stats: Stats) => void | Promise<void>;
  /**
   * @link {execa.SyncOptions}
   */
  execaOptions?: execa.SyncOptions;
};

export type WebpackDeployPluginOptions = {
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
    validate(schema, options);
    this.options = options;
  }

  apply = (compiler: Compiler) => {
    const {
      output: { path: outputDir },
      context,
    } = compiler.options;
    compiler.hooks.done.tapPromise(this.name, async (stats) => {
      const { compilation } = stats;

      if (stats.hasErrors()) {
        log("There are compilation errors, skip uploading.");
        return;
      }

      if (!this.target) {
        compilation.errors.push(logWithError("Missing upload configuration."));
        return;
      }

      const {
        type = this.target?.OSSUploadOptions ? "oss" : undefined,
        rsyncOptions,
        OSSUploadOptions,
        dest,
        patterns = "**",
        onUploadStart,
        onUploadFinish,
        execUploadFinishScripts,
        execUploadStartScripts,
        execaOptions,
        maxAttempts = 3,
        timeout,
      } = this.target;

      const assets = multimatch(
        Object.keys(stats.compilation.assets),
        patterns
      );

      if (!assets.length) {
        compilation.errors.push(logWithError("No files to upload."));
        return;
      }

      onUploadStart?.(stats);
      execScripts(execUploadStartScripts, {
        ...execaOptions,
        cwd: context,
      });

      if (type === "rsync") {
        await rsync(assets, dest, rsyncOptions?.args, {
          timeout,
          ...execaOptions,
          cwd: outputDir,
        });
      } else if (type === "oss") {
        await ossUpload({
          cwd: outputDir,
          maxAttempts,
          timeout,
          ...OSSUploadOptions,
          targets: {
            dest: dest,
            ...OSSUploadOptions.targets,
            src: assets,
          },
        });
      } else {
        compilation.errors.push(
          logWithError("Upload only supports rsync and oss.")
        );
        return;
      }

      await onUploadFinish?.(stats);
      execScripts(execUploadFinishScripts, {
        ...execaOptions,
        cwd: context,
      });

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

function log(...rest) {
  return console.log.call(null, logPrefix, ...rest);
}

function logWithError(str: string) {
  log(str);
  return new WebpackError(`${logPrefix}${str}`);
}

function execScripts(
  scripts: string[][] | string[],
  options?: execa.SyncOptions
) {
  if (!scripts?.length) return;

  const arr = (Array.isArray(scripts[0]) ? scripts : [scripts]) as string[][];
  for (const script of arr) {
    const { exitCode, stderr } = execa.sync(script[0], script.slice(1), {
      stdout: "inherit",
      stderr: "inherit",
      detached: true,
      ...options,
    });
    if (exitCode !== 0) {
      throw new Error(stderr);
    }
  }
}

export default module.exports = WebpackDeployPlugin;
