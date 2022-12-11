// https://vitejs.dev/guide/env-and-mode.html#env-variables
// eslint-disable-next-line @typescript-eslint/dot-notation
const ENV = process["env"];

export default {
  PUPPETEER_LAUNCH_ARGS: (
    ENV.PUPPETEER_LAUNCH_ARGS ||
    `--disable-web-security --allow-running-insecure-content --lang=en-US,en`
  ).split(" "),
  DEFAULT_TIMEOUT_MS: Number(ENV.DEFAULT_TIMEOUT_MS || "60000")
  /* SCRAPPER_DESKTOP_VIEWPORT: JSON.parse(
    ENV.SCRAPPER_DESKTOP_VIEWPORT || `{ "width": 910, "height": 900 }`
  ),
  SCRAPPER_MOBILE_VIEWPORT: JSON.parse(
    ENV.SCRAPPER_MOBILE_VIEWPORT || `{ "width": 600, "height": 960 }`
  ) */
};
