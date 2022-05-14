import { WebpackError } from "webpack";
import type { Compiler, Stats } from "webpack";
import { ossUpload, OSSUploadOptions } from "oss-upload-tool";
import multimatch from "multimatch";
import { validate } from "schema-utils";
import shell from "shelljs";
import type { ExecOptions, ShellString } from "shelljs";

import rsync, { checkRsync } from "./rsync";
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
  onUploadStart?: (stats: Stats, shelljs: typeof shell) => void | Promise<void>;
  /**
   * Upload finish callback
   */
  onUploadFinish?: (
    stats: Stats,
    shelljs: typeof shell
  ) => void | Promise<void>;
  /**
   * @link {require("shelljs").ExecOptions}
   */
  execOptions?: ExecOptions;
  /**
   * Whether to upload the output directory completely
   * @default false `compilation.assets`
   */
  isUploadOutputDir?: boolean;
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

  private canDeploy = true;

  constructor(options: WebpackDeployPluginOptions) {
    validate(schema, options);
    this.options = options;
  }

  apply = (compiler: Compiler) => {
    const {
      output: { path: outputDir },
      context,
    } = compiler.options;
    compiler.hooks.run.tap(pluginName, () => {
      if (this.target?.type === "rsync") {
        checkRsync().catch(() => {
          this.canDeploy = false;
          log(
            "Rsync is not supported, it needs to be installed first, this compilation will not be deployed, it is recommended to cancel the installation of rsync first."
          );
        });
      }
    });

    compiler.hooks.done.tapPromise(this.name, async (stats) => {
      const { compilation } = stats;

      if (!this.canDeploy) {
        return;
      }

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
        execOptions,
        maxAttempts = 3,
        timeout,
        isUploadOutputDir,
      } = this.target;

      const assets = isUploadOutputDir
        ? patterns
        : multimatch(Object.keys(stats.compilation.assets), patterns);

      if (!assets.length) {
        compilation.errors.push(logWithError("No files to upload."));
        return;
      }

      onUploadStart?.(stats, shell);
      execScripts(execUploadStartScripts, {
        ...execOptions,
        cwd: context,
      });

      if (type === "rsync") {
        await rsync(assets, dest, rsyncOptions?.args, {
          timeout,
          ...execOptions,
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

      await onUploadFinish?.(stats, shell);
      execScripts(execUploadFinishScripts, {
        ...execOptions,
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

function execScripts(scripts: string[][] | string[], options?: ExecOptions) {
  if (!scripts?.length) return;

  const arr = (Array.isArray(scripts[0]) ? scripts : [scripts]) as string[][];
  for (const script of arr) {
    const { code, stderr } = shell.exec(script.join(" "), {
      ...options,
    }) as ShellString;
    if (code !== 0) {
      throw new Error(stderr);
    }
  }
}

export default module.exports = WebpackDeployPlugin;
