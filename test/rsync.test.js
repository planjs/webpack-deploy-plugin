import fs from "fs";
import rsync from "../lib/rsync";

describe("rsync", () => {
  it("rsync file", async () => {
    try {
      await rsync("./test/example.js", "./dist/");
      expect(fs.existsSync("./dist/test/example.js")).toBe(true);
    } catch (e) {
      console.log(e);
      expect(e).toThrowError();
    }
  });
});
