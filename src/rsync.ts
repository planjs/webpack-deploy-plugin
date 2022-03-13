import Rsync from "rsync";

function rsync(source: string, destination: string) {
  return new Promise<void>((resolve, reject) => {
    const cmd = new Rsync()
      .flags("avz")
      .shell("ssh")
      .source(source)
      .destination(destination);

    cmd.execute((error, code, cmd) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export default rsync;
