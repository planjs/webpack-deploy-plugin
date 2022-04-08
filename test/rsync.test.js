import fs from "fs";
import rsync, {checkRsync} from "../lib/rsync";

describe("rsync", () => {
  it("Rsync file", async () => {
    try {
      await rsync("./test/example.js", "./dist/");
      expect(fs.existsSync("./dist/test/example.js")).toBe(true);
    } catch (e) {
      console.log(e);
      expect(e).toThrowError();
    }
  });

  it('Check if rsync is supported', async () => {
    try {
      const res = await checkRsync();
      expect(res).not.toBe('');
    } catch (e) {
      console.log(e);
      expect(e).toThrowError();
    }
  })
});
