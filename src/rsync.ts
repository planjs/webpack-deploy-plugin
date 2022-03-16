import Rs from "rsync";

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

    rsync.execute((error, code, cmd) => {
      if (error) {
        console.log(cmd);
        reject(error);
      }
      resolve();
    });
  });
}

export default rsync;
