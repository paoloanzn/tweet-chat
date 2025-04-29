import dateformat from "dateformat";
import chalk from "chalk";

const formatDate = (timestamp: number): string => {
  return dateformat(timestamp, "mmm/dd HH:MM:ss").toUpperCase();
};

export const timestamp = (): string => {
  return formatDate(Date.now());
};

interface Logger {
  log(...msg: string[]): void;
  warn(...msg: string[]): void;
  error(...msg: string[]): void;
  info(...msg: string[]): void;
}

let logger: Readonly<Logger> | null = null;

const newLogger = () => {
  return Object.freeze({
    log: (...msg: string[]) => {
      console.log(
        chalk.bgGray.black(`[${timestamp()}]`),
        chalk.bgGreen.black("[L]"),
        chalk.white(msg),
      );
    },

    warn: (...msg: string[]) => {
      console.log(
        chalk.bgGray.black(`[${timestamp()}]`),
        chalk.bgYellow.black("[W]"),
        chalk.yellow(msg),
      );
    },

    error: (...msg: string[]) => {
      console.log(
        chalk.bgGray.black(`[${timestamp()}]`),
        chalk.bgRed.black("[E]"),
        chalk.red(msg),
      );
    },

    info: (...msg: string[]) => {
      console.log(
        chalk.bgGray.black(`[${timestamp()}]`),
        chalk.bgBlueBright.black("[I]"),
        chalk.blueBright(msg),
      );
    },
  });
};

export const getLogger = () => {
  if (!logger) {
    logger = newLogger();
  }
  return logger;
};
