import path from "path";
import { app } from "electron";
import { isDev } from "./util.js";

export const getPreloadPath = () => {
  return path.join(
    app.getAppPath(),
    isDev() ? "." : "..",
    "/dist-electron/src/electron/preload.cjs",
  );
};
