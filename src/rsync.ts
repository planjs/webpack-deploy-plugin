import Rs from "rsync";

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
      .destination(destination);

    if (args?.length) {
      rsync = args.reduce((acc, [k, v]) => acc.set(k, v), rsync);
    }

    if (cwd) {
      rsync.cwd(cwd);
    }

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
