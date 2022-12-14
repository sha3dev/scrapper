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

  public async openNewTab() {
    if (!this.browserInstance) {
      this.browserInstance = await puppeteer.launch({
        headless: true,
        args: CONFIG.PUPPETEER_LAUNCH_ARGS
      });
    }
    const newPage = await this.browserInstance.newPage();
    this.pagesCount += 1;
    return new Tab(newPage, async () => {
      this.pagesCount -= 1;
      await newPage.close();
    });
  }
}
