/**
 * Scrapper
 */

/**
 * imports: externals
 */

import puppeteer, { Browser } from "puppeteer";
import Logger from "@sha3dev/logger";

/**
 * imports: internals
 */

import CONFIG from "../config";
import Tab from "./tab";

/**
 * module: initializations
 */

const logger = new Logger("scrapper");

/**
 * types
 */

export type OpenNewTabOptions = {
  headless?: boolean;
};

/**
 * exports
 */

export default class Scrapper {
  /**
   * private: attributes
   */

  private browserInstance: Browser | null = null;

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

  public async openNewTab(options: OpenNewTabOptions = {}) {
    if (!this.browserInstance) {
      logger.debug("initializing headless browser");
      this.browserInstance = await puppeteer.launch({
        headless: options.headless,
        args: CONFIG.PUPPETEER_LAUNCH_ARGS
      });
    }
    const newPage = await this.browserInstance.newPage();
    this.pagesCount += 1;
    logger.debug(`opened new tab (${this.pagesCount})`);
    return new Tab(newPage, async () => {
      await newPage.close();
      logger.debug(`closed tab (${this.pagesCount})`);
      this.pagesCount -= 1;
    });
  }
}
