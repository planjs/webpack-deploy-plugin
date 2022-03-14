import Rs from "rsync";

function rsync(
  source: string | string[],
  destination: string,
  args?: [string, string?][]
) {
  return new Promise<void>((resolve, reject) => {
    let cmd = new Rs()
      .flags("avz")
      .shell("ssh")
      .source(source)
      .destination(destination);

    if (args?.length) {
      cmd = args.reduce((acc, [k, v]) => acc.set(k, v), cmd);
    }

    cmd.execute((error, code, cmd) => {
      if (error) {
        console.log(cmd);
        reject(error);
      }
      resolve();
    });
  });
}

export default rsync;
