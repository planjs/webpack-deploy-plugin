/**
 * @jest-environment node
 */
import compiler from "./compiler.js";

jest.setTimeout(5000);

test("test plugin", async () => {
  const stats = await compiler("example.js");
  const output = stats.toJson().modules[0].source;
  console.log(output);
});
