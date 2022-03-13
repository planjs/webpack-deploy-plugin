import fs from "fs";
import rsync from "../lib/rsync";

describe("rsync", () => {
  it("rsync file", async () => {
    try {
      await rsync("./test/", "./dist/");
      expect(fs.existsSync("./dist/rsync.test.js")).toBe(true);
    } catch (e) {
      expect(e).toThrowError();
    }
  });
});
