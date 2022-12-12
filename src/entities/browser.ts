/**
 * Browser
 */

/**
 * imports: externals
 */

import puppeteer, { Browser as PuppeteerBrowser } from "puppeteer";
import Logger from "@sha3dev/logger";

/**
 * imports: internals
 */

import CONFIG from "../config";
import Tab, { TabConfig } from "./tab";

/**
 * module: initializations
 */

const logger = new Logger("scrapper");

/**
 * exports
 */

export default class Browser {
  /**
   * private: attributes
   */

  private browserInstance: PuppeteerBrowser | null = null;

  private pagesCount: number = 0;

  /**
   * public: properties
   */

  public get PagesCount() {
    return this.pagesCount;
  }

  /**
   * public: methods
   */

  public async loadTab(tabConfig: TabConfig) {
    if (!this.browserInstance) {
      this.browserInstance = await puppeteer.launch({
        headless: true,
        args: CONFIG.PUPPETEER_LAUNCH_ARGS
      });
    }
    const newPage = await this.browserInstance.newPage();
    this.pagesCount += 1;
    logger.debug(
      `opening new page: ${tabConfig.url} (count: ${this.pagesCount})`
    );
    return new Tab(newPage, tabConfig, async () => {
      this.pagesCount -= 1;
      await newPage.close();
      logger.debug(
        `closing page: ${tabConfig.url} (count: ${this.pagesCount})`
      );
    });
  }
}
