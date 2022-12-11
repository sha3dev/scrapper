/**
 * PageElement
 */

/**
 * imports: externals
 */

import { Page, ElementHandle } from "puppeteer";
import Logger from "@sha3dev/logger";

/**
 * imports: internals
 */

// import CONFIG from "../config";

/**
 * module: initializations
 */

const logger = new Logger("scrapper");

/**
 * types
 */

/**
 * exports
 */

export default class PageElement {
  /**
   * static: attributes
   */

  private static currentElementIndex: number = 0;

  /**
   * private: attributes
   */

  private id: number;

  /**
   * private: methods
   */

  /**
   * constructor
   */

  constructor(private parentPage: Page, private elementHandle: ElementHandle) {
    this.id = PageElement.currentElementIndex;
    PageElement.currentElementIndex += 1;
  }

  /**
   * public: properties
   */

  /**
   * public: methods
   */

  public async remove() {
    logger.debug(`removing element ${this.id} from page`);
    await this.elementHandle.evaluate<HTMLElement[]>(
      (i) => i && i.parentNode && i.parentNode.removeChild(i)
    );
  }

  public async hide() {
    logger.debug(`hidding element ${this.id} from page`);
    await this.elementHandle.evaluate<HTMLElement[]>((i: any) => {
      // eslint-disable-next-line no-param-reassign
      i.style.display = "none";
    });
  }

  public async toImageBuffer(options: { omitBackground?: boolean } = {}) {
    const buffer = await this.elementHandle.screenshot({
      omitBackground: !!options.omitBackground
    });
    return buffer;
  }

  public async getPropertyJsonValue(propertyName: string) {
    const property = await this.elementHandle.getProperty(propertyName);
    const propertyValue = property ? await property.jsonValue() : null;
    return propertyValue;
  }

  public async evaluate(fn: (elem: HTMLElement) => any) {
    const fnString = fn.toString();
    return this.elementHandle.evaluate(fnString);
  }
}
