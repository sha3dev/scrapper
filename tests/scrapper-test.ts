import { describe, expect, test } from "vitest";
import PupeteerTab from "../src/lib/pupeteer-tab";

let tab: PupeteerTab;

describe("pupeteer-tab", () => {
  test("exec without loading", async () => {
    await expect(
      (async () => {
        tab = new PupeteerTab({
          url: "https://google.com",
          viewport: "desktop"
        });
        let isError = false;
        try {
          await tab.addStyle(`body { opacity: 0; }`);
        } catch (e) {
          isError = true;
        }
        return isError;
      })()
    ).resolves.toEqual(true);
  });

  test("load tab", async () => {
    await expect(
      (async () => {
        tab = new PupeteerTab({
          url: "https://google.com",
          viewport: "desktop"
        });
        await tab.load();
        return tab.Url === "https://www.google.com/";
      })()
    ).resolves.toEqual(true);
  });

  test("add style", async () => {
    await expect(
      (async () => {
        await tab.addStyleTag(`body { opacity: 0; }`);
        return true;
      })()
    ).resolves.toEqual(true);
  });

  test("exec function", async () => {
    await expect(
      (async () => {
        const fnResult = await tab.exec(
          (window: Window) => window.location.hostname
        );
        return fnResult === "www.google.com";
      })()
    ).resolves.toEqual(true);
  });

  test("wait function", async () => {
    await expect(
      (async () => {
        const fnToWait = tab.wait((window: Window) =>
          window.document.body.classList.contains("test")
        );
        setTimeout(() =>
          tab.exec((window: Window) =>
            window.document.body.classList.add("test")
          )
        );
        await fnToWait;
        return true;
      })()
    ).resolves.toEqual(true);
  });

  test("close function", async () => {
    await expect(
      (async () => {
        const initialPageCount = PupeteerTab.PagesCount;
        await tab.close();
        const finalPageCount = PupeteerTab.PagesCount;
        return initialPageCount > finalPageCount;
      })()
    ).resolves.toEqual(true);
  });
});
