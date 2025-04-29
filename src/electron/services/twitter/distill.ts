import { type Profile, type Tweet } from "agent-twitter-client";
import { getScraper } from "../twitter/scraper.js";
import { writeFileSync } from "fs";

export interface DistillConfiguration {
  readonly username: string;
  readonly maxTweets: number;
}

export interface DistillResult {
  readonly success: boolean;
  readonly message: string | null;
  readonly file: string | null;
  readonly profile: DistilledProfile | null;
}

export interface DistilledProfile {
  readonly username: string;
  readonly profile: Profile;
  readonly tweets: Tweet[];
}

const scrapeSettings = Object.freeze({
  MAX_TWEETS: 300,
});

export const distill = async ({
  username,
  maxTweets,
}: DistillConfiguration): Promise<DistillResult> => {
  const scraper = getScraper();

  if (!(await scraper.isLoggedIn())) {
    return {
      success: false,
      message: "scraper is not logged in.",
      file: null,
      profile: null,
    };
  }

  if (username === "") {
    return {
      success: false,
      message: "username is empty.",
      file: null,
      profile: null,
    };
  }

  const tweetsIterator = scraper.getTweets(
    username,
    maxTweets <= scrapeSettings.MAX_TWEETS
      ? maxTweets
      : scrapeSettings.MAX_TWEETS,
  );
  const tweets = new Array<Tweet>();

  for await (const tweet of tweetsIterator) {
    if (tweet) {
      tweets.push(tweet);
    }
  }

  if (tweets.length === 0) {
    return {
      success: false,
      message: "no tweets found.",
      file: null,
      profile: null,
    };
  }

  const profile = await scraper.getProfile(username);

  return {
    success: true,
    message: null,
    file: null,
    profile: { username, profile, tweets },
  };
};
