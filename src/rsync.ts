import os from "os";
import Rs from "rsync";

import { logPrefix, UnixMaxShellLen, WindowMaxShellLen } from "./const";

/**
 * rsync文件
 * 这里默认会保留文件目录结构
 * @param source
 * @param destination
 * @param args
 * @param cwd
 */
function rsync(
  source: string | string[],
  destination: string,
  args?: [string, string?][],
  cwd?: string
) {
  function exec(source: string | string[]) {
    return new Promise<void>((resolve, reject) => {
      let rsync = new Rs()
        .flags("avz")
        .shell("ssh")
        .source(source)
        .set("R")
        .destination(destination);

      if (args?.length) {
        rsync = args.reduce((acc, [k, v]) => acc.set(k, v), rsync);
      }

      if (cwd) {
        rsync.cwd(cwd);
      }

      // @ts-ignore 类型缺失
      rsync.env(process.env);

      rsync.execute(
        (error, code, cmd) => {
          if (error) {
            console.log(logPrefix, code, error, cmd);
            reject(error);
          }
          resolve();
        },
        (stdout) => {
          process.stdout.write(stdout.toString("utf-8") + "\n");
        },
        (stderr) => {
          process.stdout.write(stderr.toString("utf-8") + "\n");
        }
      );
    });
  }

  let max = UnixMaxShellLen;
  if (os.type() === "Windows_NT") {
    max = WindowMaxShellLen;
  }

  // 有些环境命令行最长长度配置不对，使用这个更改切割规则
  if (+process.env.MAX_COMMAND_LINE_LIMIT) {
    max = +process.env.MAX_COMMAND_LINE_LIMIT;
  }

  const _source = Array.isArray(source) ? source : [source];

  const defaultLen = 100 + (destination || "").length;
  let count = defaultLen;

  const chunkList = _source.reduce<string[][]>(
    (acc, item) => {
      if (typeof item !== "string") return acc;

      count += item.length;
      if (count > max) {
        acc.push([item]);
        count = defaultLen;
      } else {
        acc[acc.length - 1].push(item);
      }
      return acc;
    },
    [[]]
  );

  return Promise.all(chunkList.map(exec));
}

export default rsync;
