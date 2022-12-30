/**
 * Helpers
 */

/**
 * imports: externals
 */

/**
 * imports: internals
 */

/**
 * types
 */

/**
 * module: initializations
 */

/**
 * consts
 */

const RANDOM_STRING_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const RANDOM_STRING_ALPHABET_LENGTH = RANDOM_STRING_ALPHABET.length;

/**
 * exports
 */

export default abstract class Helpers {
  /**
   * static: methods
   */

  public static randomString(length = 10): string {
    return [...new Array(length)]
      .map(() =>
        RANDOM_STRING_ALPHABET.charAt(
          Math.floor(Math.random() * RANDOM_STRING_ALPHABET_LENGTH)
        )
      )
      .join("");
  }
}
