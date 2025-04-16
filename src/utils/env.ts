import { readFileSync, writeFileSync } from "fs";
import { getLogger } from "./logger";

const logger = getLogger();

export const addOrUpdateEnvVariable = (key: string, value: string): void => {
  const envPath = ".env";
  let envContent = "";

  try {
    envContent = readFileSync(envPath, "utf8");
  } catch (err) {
    logger.info(".env file not found. Creating a new one.");
  }

  const lines = envContent.split("\n");

  // Check if the key exists in the file
  let keyFound = false;
  const updatedLines = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      keyFound = true;
      // Update the line only if no value is set
      const [existingKey, existingValue] = line.split("=");
      return existingValue ? line : `${existingKey}=${value}`;
    }
    return line;
  });

  // If the key was not found, add it as a new variable
  if (!keyFound) {
    updatedLines.push(`${key}=${value}`);
  }

  writeFileSync(envPath, updatedLines.join("\n"));
};
