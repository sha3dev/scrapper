/**
 * imports: externals
 */

import puppeteer, { Page, Browser, ElementHandle } from "puppeteer";
import sharp from "sharp";
import { JSDOM } from "jsdom";
import TaggedConsole from "@sha3dev/tagged-console";

/**
 * imports: internals
 */

import config from "./config";

/**
 * types
 */

export type PupeteerTabConfig = {
  url: string;
  viewport: "desktop" | "mobile";
  style?: string;
  headers?: Record<string, string>;
};

/**
 * consts
 */

const console = new TaggedConsole("scrapper");

/**
 * exports
 */

export default class Scrapper {
  // static: attributes

  private static browser: Browser | null = null;

  private static pagesCount: number = 0;

  // private: attributes

  private page: Page | null = null;

  private document: Document | null = null;

  private currentElemIndex: number = 0;

  private elemsByIndex: Record<number, ElementHandle> = {};

  // static: methods

  private static async openNewPage() {
    if (!PupeteerTab.browser) {
      PupeteerTab.browser = await puppeteer.launch({
        headless: true,
        args: [
          "--disable-web-security",
          "--allow-running-insecure-content",
          "--lang=en-US,en"
        ]
      });
    }
    const page = await PupeteerTab.browser.newPage();
    return page;
  }

  // static: properties

  public static get PagesCount() {
    return PupeteerTab.pagesCount;
  }

  // private: properties

  private get Page() {
    if (this.page) {
      return this.page;
    } else {
      throw new Error(`this tab is not loaded, call load() first`);
    }
  }

  private get Document() {
    if (this.document) {
      return this.document;
    } else {
      throw new Error(`this tab is not loaded, call load() first`);
    }
  }

  // private: methods

  private addElem(elem: ElementHandle) {
    this.currentElemIndex += 1;
    this.elemsByIndex[this.currentElemIndex] = elem;
    return this.currentElemIndex;
  }

  private getElemByIndex(index: number, remove: boolean = false) {
    if (!this.elemsByIndex[index]) {
      throw new Error(`elem with id ${index} not found`);
    } else {
      const result = this.elemsByIndex[this.currentElemIndex];
      remove && delete this.elemsByIndex[this.currentElemIndex];
      return result;
    }
  }

  private async wait(functionToExec: Function, timeout?: number) {
    const wrappedFunction = `((${functionToExec.toString()})(window))`;
    return this.Page.waitForFunction(wrappedFunction, { timeout });
  }

  private async exec(functionToExec: Function) {
    const wrappedFunction = `((${functionToExec.toString()})(window))`;
    const result = await this.Page.evaluate(wrappedFunction);
    return result;
  }

  private async getScrollerOffsetHeight() {
    return this.exec((window: Window) => {
      const scroller = window.document.querySelector<HTMLDivElement>(
        ".notion-scroller.vertical"
      );
      return scroller ? scroller.offsetHeight : null;
    });
  }

  private async getVerticalScroll() {
    return await tab.exec((window: Window) =>
      window.document.querySelector(".notion-scroller.vertical") &&
      window.document.querySelector(".notion-scroller.vertical").scrollHeight
        ? (window.document.querySelector(".notion-scroller.vertical")
            .scrollTop +
            window.document.querySelector<HTMLDivElement>(
              ".notion-scroller.vertical"
            ).offsetHeight) /
          window.document.querySelector(".notion-scroller.vertical")
            .scrollHeight
        : null
    );
  }

  private async moveScrollToBottom() {
    let scrollPerc = await this.getVerticalScroll(tab);
    const scrollerHeight = await this.getScrollerOffsetHeight(tab);
    if (scrollPerc !== null) {
      while (scrollPerc < 0.9) {
        await this.moveScroll(tab, scrollerHeight);
        scrollPerc = await this.getVerticalScroll(tab);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private async initialize() {
    await this.wait(
      (window: Window) => window.document.querySelector(".notion-page-content"),
      DEFAULT_BROWSER_TIMEOUT
    );

    await this.moveScrollToBottom(tab);

    await tab.wait({
      functionToExec: (window: Window) =>
        !window.document.querySelector(".loading-spinner"),
      timeout: DEFAULT_BROWSER_TIMEOUT
    });

    // remove topbar

    await tab.exec((window: Window) => {
      window.document.querySelector(".notion-topbar").remove();
    });
  }

  // pulic properties

  public get Url() {
    return this.Page.url();
  }

  // constructor

  constructor(private tabConfig: PupeteerTabConfig) {
    console.debug`new tab created: ${tabConfig.url}`;
  }

  // public: methods

  public async load() {
    console.debug`loading tab ${this.tabConfig.url}`;
    // create page
    this.page = await PupeteerTab.openNewPage();
    PupeteerTab.pagesCount += 1;
    // set viewport (mobile or desktop)
    await this.page.setViewport(
      this.tabConfig.viewport === "desktop"
        ? config.PUPETEER_WRAPPER_DESKTOP_VIEWPORT
        : config.PUPETEER_WRAPPER_MOBILE_VIEWPORT
    );
    // set extra headers (if needed)
    if (this.tabConfig.headers) {
      await this.page.setExtraHTTPHeaders(this.tabConfig.headers);
    }
    // navigate to url
    await this.page.goto(this.tabConfig.url, {
      waitUntil: "networkidle0",
      timeout: config.PUPETEER_WRAPPER_DEFAULT_TIMEOUT_MS
    });
    // load jsdom
    const html = await this.page.evaluate(
      `(() => document.documentElement.innerHTML)()`
    );
    ({ document: this.document } = new JSDOM(html as string).window);
    // inject styles (if needed)
    if (this.tabConfig.style) {
      await this.page.addStyleTag({ content: this.tabConfig.style });
    }
  }

  public async close() {
    console.debug`closing tab ${this.tabConfig.url}`;
    await this.Page.close();
    PupeteerTab.pagesCount -= 1;
    this.page = null;
    if (!PupeteerTab.pagesCount) {
      await PupeteerTab.browser?.close();
    }
  }

  public async addStyleTag(style: string): Promise<number> {
    const elem = await this.Page.addStyleTag({ content: style });
    return this.addElem(elem);
  }

  public async nodeShot(
    selector: string,
    options: {
      trim?: boolean;
      backgroundColor?: string;
    } = {}
  ) {
    const elem = await this.Page.$(selector);
    if (elem) {
      const buffer = await elem.screenshot({ omitBackground: true });
      let sharpInstance = sharp(buffer);
      if (options.trim) {
        sharpInstance = sharpInstance.trim();
      }
      if (options.backgroundColor) {
        sharpInstance = sharpInstance.flatten({
          background: options.backgroundColor
        });
      }
      return sharpInstance.toBuffer();
    } else {
      return null;
    }
  }

  public async getEmojisBySelector() {
    const elems = await this.Page.$$(EMOJI_SELECTOR);
    const emojis = await Promise.all(
      elems.map((elem) =>
        (async () => {
          const [ariaLabelProperty, offsetHeightProperty, offsetWidthProperty] =
            await Promise.all([
              elem.getProperty("ariaLabel"),
              elem.getProperty("offsetHeight"),
              elem.getProperty("offsetWidth")
            ]);
          const [ariaLabel, offsetHeight, offsetWidth]: [
            string | null,
            number | null,
            number | null
          ] = await Promise.all([
            ariaLabelProperty ? ariaLabelProperty.jsonValue() : null,
            offsetHeightProperty
              ? Number(offsetHeightProperty.jsonValue())
              : null,
            offsetWidthProperty ? Number(offsetWidthProperty.jsonValue()) : null
          ]);
          return { ariaLabel, offsetHeight, offsetWidth, elem };
        })()
      )
    );

    const emojisHash: Record<
      string,
      {
        ariaLabel: string | null;
        offsetHeight: number | null;
        offsetWidth: number | null;
        elem: ElementHandle<Element>;
      }
    > = {};
    emojis
      .sort((a, b) => (b.offsetHeight || 0) - (a.offsetHeight || 0))
      .forEach((e) => {
        if (e.ariaLabel && !emojisHash[e.ariaLabel]) {
          emojisHash[e.ariaLabel] = e;
        }
      });
    const result: Record<string, Buffer | string> = {};
    await Promise.all(
      Object.keys(emojisHash).map((ariaLabel) =>
        (async () => {
          const { offsetHeight, offsetWidth, elem } = emojisHash[ariaLabel];
          if (offsetHeight && offsetWidth && offsetHeight > offsetWidth) {
            await elem.evaluate((i: any) => {
              // eslint-disable-next-line no-param-reassign
              i.style.paddingRight = `${i.offsetHeight - i.offsetWidth}px`;
            });
          }
          result[ariaLabel] = await elem.screenshot({ omitBackground: true });
        })()
      )
    );
    return result;
  }

  public async hideNodeBySelector(selector: string) {
    await this.Page.evaluate((nodeSelector: string) => {
      const node = window.document.querySelector<HTMLElement>(nodeSelector);
      node && (node.style.display = "none");
    }, selector);
  }

  public async getCoverImage(options: { icon: Buffer | null }) {
    let buffer: Buffer | string | null = null;
    const elem = await this.Page.$(COVER_IMAGE_SELECTOR);
    if (elem) {
      buffer = await elem.screenshot({ omitBackground: true });
      if (options.icon) {
        const icon = await sharp(options.icon);
        const iconMetadata = await icon.metadata();
        const incHeight = iconMetadata?.height ? iconMetadata.height / 2 : null;
        if (incHeight) {
          const sharpInstance = sharp(buffer)
            .extend({
              bottom: Number(incHeight.toString()),
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .composite([
              {
                input: options.icon,
                top: Number((COVER_IMAGE_HEIGHT_PX - incHeight).toString()),
                left: 10
              }
            ]);
          buffer = await sharpInstance.toBuffer();
        }
      }
    }
    return buffer;
  }

  public async getDocumentNodesBySelector(blocksSelector: string) {
    const blocks = Array.from(
      this.Document.querySelectorAll<HTMLDivElement>(blocksSelector)
    );
    return blocks;
  }

  public async removeIndexFromDom(indexToRemove: number) {
    const elem = this.getElemByIndex(indexToRemove);
    await elem.evaluate<HTMLElement[]>(
      (i) => i && i.parentNode && i.parentNode.removeChild(i)
    );
  }
}
