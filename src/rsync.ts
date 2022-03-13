import Rs from "rsync";

function rsync(
  source: string | string[],
  destination: string,
  exclude?: string | string[]
) {
  return new Promise<void>((resolve, reject) => {
    let cmd = new Rs()
      .flags("avz")
      .shell("ssh")
      .source(source)
      .destination(destination);

    if (exclude?.length) {
      cmd = cmd.exclude(exclude);
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
