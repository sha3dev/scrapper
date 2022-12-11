/**
 * Tab
 */

/**
 * imports: externals
 */

import { Page } from "puppeteer";
import Logger from "@sha3dev/logger";

/**
 * imports: internals
 */

import CONFIG from "../config";
import Element from "./element";

/**
 * module: initializations
 */

const logger = new Logger("scrapper");

/**
 * types
 */

export type TabViewPort = {
  width: number;
  height: number;
};

export type TabConfig = {
  url: string;
  viewport: TabViewPort;
  style?: string;
  headers?: Record<string, string>;
};

/**
 * exports
 */

export default class Tab {
  /**
   * private: attributes
   */

  /**
   * private: methods
   */

  private async setViewport(viewport: TabViewPort) {
    await this.page.setViewport(viewport);
  }

  private async setExtraHeaders(headers?: Record<string, string>) {
    if (headers) {
      await this.page.setExtraHTTPHeaders(headers);
    }
  }

  private async navigateToUrl(url: string) {
    // navigate to url
    await this.page.goto(url, {
      waitUntil: "networkidle0",
      timeout: CONFIG.SCRAPPER_DEFAULT_TIMEOUT_MS
    });
  }

  private async execFunction(functionToExec: (window: Window) => any) {
    const wrappedFunction = `((${functionToExec.toString()})(window))`;
    const result = await this.page.evaluate(wrappedFunction);
    return result;
  }

  private async waitForFunction(
    functionToExec: (window: Window) => any,
    timeout?: number
  ) {
    const wrappedFunction = `((${functionToExec.toString()})(window))`;
    return this.page.waitForFunction(wrappedFunction, { timeout });
  }

  private async getScrollerOffsetHeight(selector: string) {
    const offsetHeightValue = await this.exec((window: Window) => {
      const scroller = window.document.querySelector<HTMLDivElement>(selector);
      return scroller ? scroller.offsetHeight : null;
    });
    return !Number.isNaN(offsetHeightValue) ? Number(offsetHeightValue) : null;
  }

  private async getVerticalScroll(selector: string) {
    const scrollValue = await this.exec((window: Window) => {
      const verticalScroller =
        window.document.querySelector<HTMLDivElement>(selector);
      if (verticalScroller?.scrollHeight) {
        return (
          (verticalScroller.scrollTop + verticalScroller.offsetHeight) /
          verticalScroller.scrollHeight
        );
      }
      return null;
    });
    return !Number.isNaN(scrollValue) ? Number(scrollValue) : null;
  }

  private async moveVerticalScroll(selector: string, distanceInPixels: number) {
    await this.page.evaluate(
      `document.querySelector(selector).scrollTop += ${distanceInPixels}`
    );
  }

  /**
   * constructor
   */

  constructor(
    private page: Page,
    private tabConfig: TabConfig,
    // closeFunction: function to invoke for closing this page and free resources
    // on parent browser instance
    private closeFunction: () => Promise<void>
  ) {}

  /**
   * public: properties
   */

  public get Url() {
    return this.page.url();
  }

  /**
   * public: methods
   */

  public async load() {
    logger.debug(`loading tab ${this.tabConfig.url}`);
    await this.setViewport(this.tabConfig.viewport);
    await this.setExtraHeaders(this.tabConfig.headers);
    await this.navigateToUrl(this.tabConfig.url);
  }

  public async close() {
    logger.debug(`closing tab ${this.tabConfig.url}`);
    await this.closeFunction();
  }

  public async addStyleTag(style: string) {
    const elem = await this.page.addStyleTag({ content: style });
    const element = new Element(this.page, elem);
    return element;
  }

  public async moveScrollToBottom(selector: string) {
    let scrollPerc = await this.getVerticalScroll(selector);
    const scrollerHeight = await this.getScrollerOffsetHeight(selector);
    while (scrollerHeight !== null && scrollPerc !== null && scrollPerc < 0.9) {
      // eslint-disable-next-line no-await-in-loop
      await this.moveVerticalScroll(selector, scrollerHeight);
      // eslint-disable-next-line no-await-in-loop
      scrollPerc = await this.getVerticalScroll(selector);
      // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  public async waitForSelector(selector: string, timeout: number) {
    await this.waitForFunction(
      (window: Window) => window.document.querySelector(selector),
      timeout
    );
  }
}
