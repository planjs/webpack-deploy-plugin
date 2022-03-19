import fs from "fs";
import path from "path";
/**
 * @jest-environment node
 */
import compiler from "./compiler.js";

jest.setTimeout(5000);

describe("deploy plugin", () => {
  test("rsync output", async () => {
    const stats = await compiler("example.js");
    Object.keys(stats.compilation.assets).forEach((file) => {
      expect(fs.existsSync(path.join(__dirname, "dist", "rsync", file))).toBe(
        true
      );
    });
  });
});
