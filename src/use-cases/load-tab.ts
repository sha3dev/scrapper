/**
 * UseCase: LoadPage
 */

/**
 * imports: externals
 */

import Logger from "@sha3dev/logger";

/**
 * imports: internals
 */

import CONFIG from "../config";
import Browser from "../entities/browser";
import { TabConfig } from "../entities/tab";

/**
 * module: initializations
 */

const logger = new Logger("scrapper");

const browserInstance: Browser = new Browser();

/**
 * types
 */

export type WaitAndScrollToBottomOptions = {
  selectorToWait: string;
  containerSelectorToScroll: string;
  selectorToWaitAfterScroll: string;
  waitTimeout?: number;
};

export type LoadTabOptions = {
  tabConfig: TabConfig;
  waitAndScrollToBottom?: WaitAndScrollToBottomOptions;
};

/**
 * exports
 */

export default async (options: LoadTabOptions) => {
  logger.debug(`LoadTab: ${options.tabConfig.url}`);
  const tab = await browserInstance.loadTab(options.tabConfig);
  if (options.waitAndScrollToBottom) {
    logger.debug(`scrolling bottom to force lazy loading`);
    if (options.waitAndScrollToBottom.selectorToWait) {
      await tab.waitForSelector(
        options.waitAndScrollToBottom.selectorToWait,
        options.waitAndScrollToBottom.waitTimeout || CONFIG.DEFAULT_TIMEOUT_MS
      );
    }
    if (options.waitAndScrollToBottom.containerSelectorToScroll) {
      await tab.moveScrollToBottom(
        options.waitAndScrollToBottom.containerSelectorToScroll
      );
    }
    if (options.waitAndScrollToBottom.selectorToWaitAfterScroll) {
      await tab.waitForSelector(
        options.waitAndScrollToBottom.selectorToWaitAfterScroll,
        options.waitAndScrollToBottom.waitTimeout || CONFIG.DEFAULT_TIMEOUT_MS
      );
    }
  }
};
