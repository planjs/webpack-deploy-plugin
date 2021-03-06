import os from "os";
import shell from "shelljs";
import type { ExecOptions, ShellString } from "shelljs";

import { logPrefix, UnixMaxShellLen, WindowMaxShellLen } from "./const";

/**
 * rsync文件
 * 这里默认会保留文件目录结构
 * @param source
 * @param destination
 * @param args rsync args
 * @param options
 */
function rsync(
  source: string | string[],
  destination: string,
  args?: [string, string?][],
  options?: ExecOptions
) {
  function exec(source: string | string[]) {
    return new Promise<void>((resolve, reject) => {
      const target = Array.isArray(source) ? source : [source];

      const res = shell.exec(
        [
          "rsync",
          "-avzR",
          ...(args || []).reduce<string[]>((acc, item: string[]) => {
            acc.push(`--${item.join("=")}`);
            return acc;
          }, []),
          ...target,
          destination,
        ].join(" "),
        { ...options }
      ) as ShellString;

      console.log("");
      if (res.code === 0) {
        console.log(res.stdout);
        resolve();
      } else {
        console.log(logPrefix, res.stderr);
        reject(new Error(res.stderr));
      }
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

      count += item.length + 1;
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

export function checkRsync() {
  return new Promise((resolve, reject) => {
    const res = shell.exec(
      (os.type() === "Windows_NT" ? "where" : "whereis") + " rsync",
      {
        silent: true,
      }
    );
    if (res.code === 0) {
      resolve(res.stdout);
      return;
    }
    reject(new Error(res.stderr));
  });
}

export default rsync;
