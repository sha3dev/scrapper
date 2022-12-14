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

export type TabWaitAndScrollToBottomOptions = {
  selectorToWait?: string;
  containerSelectorToScroll: string;
  selectorToWaitAfterScroll?: string;
  waitTimeout?: number;
};

export type TabConfig = {
  url: string;
  viewport: TabViewPort;
  style?: string;
  headers?: Record<string, string>;
  waitAndScrollOptions?: TabWaitAndScrollToBottomOptions;
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
      timeout: CONFIG.DEFAULT_TIMEOUT_MS
    });
  }

  private async execFunction(functionToExec: string) {
    const wrappedFunction = `((${functionToExec})(window))`;
    const result = await this.page.evaluate(wrappedFunction);
    return result;
  }

  private async waitForFunction(functionToExec: string, timeout?: number) {
    const wrappedFunction = `((${functionToExec})(window))`;
    return this.page.waitForFunction(wrappedFunction, { timeout });
  }

  private async waitForSelector(selector: string, timeout: number) {
    const functionToExec = `() => window.document.querySelector('${selector}')`;
    await this.waitForFunction(functionToExec, timeout);
  }

  private async waitForSelectorDisappear(selector: string, timeout: number) {
    const functionToExec = `() => window.document.querySelector('${selector}')`;
    await this.waitForFunction(functionToExec, timeout);
  }

  private async getScrollerOffsetHeight(selector: string) {
    const offsetHeightValue = await this.execFunction(
      `() => {
        const scroller = window.document.querySelector('${selector}');
        return scroller ? scroller.offsetHeight : null;
      }`
    );
    return !Number.isNaN(offsetHeightValue) ? Number(offsetHeightValue) : null;
  }

  private async getVerticalScroll(selector: string) {
    const scrollValue = await this.execFunction(
      `() => {
        const verticalScroller = window.document.querySelector('${selector}');
        if (verticalScroller.scrollHeight) {
          return (
            (verticalScroller.scrollTop + verticalScroller.offsetHeight) /
            verticalScroller.scrollHeight
          );
        }
        return null;
      }`
    );
    return !Number.isNaN(scrollValue) ? Number(scrollValue) : null;
  }

  private async moveVerticalScroll(selector: string, distanceInPixels: number) {
    await this.execFunction(
      `() => document.querySelector('${selector}').scrollTop += ${distanceInPixels}`
    );
  }

  private async moveScrollToBottom(selector: string) {
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

  /**
   * constructor
   */

  constructor(
    private page: Page,
    // closeFunction: function to invoke for closing this page and free resources
    // on parent browser instance
    private closeFunction: () => Promise<void>
  ) {}

  /**
   * public: methods
   */

  public async load(tabConfig: TabConfig) {
    logger.debug(`loading tab ${tabConfig.url}`);
    await this.setViewport(tabConfig.viewport);
    await this.setExtraHeaders(tabConfig.headers);
    await this.navigateToUrl(tabConfig.url);
    if (tabConfig.waitAndScrollOptions?.containerSelectorToScroll) {
      logger.debug(
        `scrolling bottom to force lazy loading (container: ${tabConfig.waitAndScrollOptions.containerSelectorToScroll})`
      );
      if (tabConfig.waitAndScrollOptions.selectorToWait) {
        await this.waitForSelector(
          tabConfig.waitAndScrollOptions.selectorToWait,
          tabConfig.waitAndScrollOptions.waitTimeout ||
            CONFIG.DEFAULT_TIMEOUT_MS
        );
      }
      await this.moveScrollToBottom(
        tabConfig.waitAndScrollOptions.containerSelectorToScroll
      );
      if (tabConfig.waitAndScrollOptions.selectorToWaitAfterScroll) {
        await this.waitForSelectorDisappear(
          tabConfig.waitAndScrollOptions.selectorToWaitAfterScroll,
          tabConfig.waitAndScrollOptions.waitTimeout ||
            CONFIG.DEFAULT_TIMEOUT_MS
        );
      }
    }
  }

  public async close() {
    await this.closeFunction();
  }

  public async addStyleTag(style: string) {
    const elem = await this.page.addStyleTag({ content: style });
    const element = new Element(this.page, elem);
    return element;
  }

  public async querySelector(selector: string) {
    const elementHandle = await this.page.$(selector);
    return elementHandle ? new Element(this.page, elementHandle) : null;
  }
}
