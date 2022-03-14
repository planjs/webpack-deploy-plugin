import path from "path";
import webpack from "webpack";

import WebpackDeployPlugin from "../";

export default (fixture, options = {}) => {
  const compiler = webpack({
    context: __dirname,
    entry: `./${fixture}`,
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bundle.js",
    },
    plugins: [
      new WebpackDeployPlugin({
        targets: {
          type: "rsync",
          rsyncOptions: "./dist",
          exclude: "**/bundle.js",
        },
      }),
    ],
  });

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) reject(err);
      if (stats.hasErrors()) reject(new Error(stats.toJson().errors));

      resolve(stats);
    });
  });
};
