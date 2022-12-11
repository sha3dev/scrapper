import { describe, expect, test } from "vitest";
import loadTab from "../src/use-cases/load-tab";

describe("LoadTab", () => {
  test("load url", async () => {
    await expect(
      (async () => {
        const tab = await loadTab({
          tabConfig: {
            url: "https://google.com",
            viewport: "desktop"
          }
        });
      })()
    ).resolves.toEqual(true);
  });
});
