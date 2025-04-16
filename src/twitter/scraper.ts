import { Scraper } from "agent-twitter-client";

let scraper: Scraper | null = null;

export const getScraper = (): Scraper => {
  if (!scraper) {
    scraper = new Scraper();
  }
  return scraper;
};
