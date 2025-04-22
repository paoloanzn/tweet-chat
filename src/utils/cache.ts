import * as fs from "fs";
import * as path from "path";

export interface Cache {
  [key: symbol]: string;
  save(key: string, value: string): boolean;
  get(key: string): string | null;
  path(): string;
}

export const createCache = (customPath?: string): Cache => {
  const cachePath = createCacheFolder(customPath);
  const cache: Cache = Object.create(null);

  // check for existing cache files and load them into memory
  const files = fs.readdirSync(cachePath);
  for (const file of files) {
    const filePath = path.join(cachePath, file);
    if (fs.statSync(filePath).isFile()) {
      try {
        const content = fs.readFileSync(filePath, "utf8");
        cache[Symbol.for(file)] = content; // Store in memory for quick access
      } catch (error) {
        console.error(`Failed to read cache file ${file}: ${error}`);
      }
    }
  }

  cache.path = () => {
    return cachePath;
  };

  cache.get = (key: string) => {
    const cachedValue = cache[Symbol.for(key)];
    if (cachedValue) {
      return cachedValue;
    }

    return null;
  };

  cache.save = (key: string, value: string) => {
    try {
      const filePath = path.join(cachePath, key);
      fs.writeFileSync(filePath, value, "utf8");

      cache[Symbol.for(key)] = value; // Store in memory for quick access

      return true;
    } catch (error) {
      return false;
    }
  };

  cache[Symbol.for("cachePath")] = cachePath;

  return cache;
};

const createCacheFolder = (customPath?: string): string => {
  // Use current working directory if no path specified
  const cachePath = customPath
    ? path.resolve(customPath, "cache")
    : path.join(process.cwd(), "cache");

  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true });
  }

  return cachePath;
};
