import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getPreloadPath = () => {
  // Assuming preload.cjs is compiled into the same directory as main.js
  return path.join(__dirname, "preload.cjs");
};
