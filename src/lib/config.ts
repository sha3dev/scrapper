// https://vitejs.dev/guide/env-and-mode.html#env-variables
// eslint-disable-next-line @typescript-eslint/dot-notation
const ENV = process["env"];

export default {
  PUPETEER_WRAPPER_DESKTOP_VIEWPORT: JSON.parse(
    ENV.PUPETEER_WRAPPER_DESKTOP_VIEWPORT || `{ "width": 910, "height": 900 }`
  ),
  PUPETEER_WRAPPER_MOBILE_VIEWPORT: JSON.parse(
    ENV.PUPETEER_WRAPPER_MOBILE_VIEWPORT || `{ "width": 600, "height": 960 }`
  ),
  PUPETEER_WRAPPER_DEFAULT_TIMEOUT_MS: Number(
    ENV.PUPETEER_WRAPPER_DEFAULT_TIMEOUT_MS || "60000"
  )
};