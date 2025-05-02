import { getScraper } from "./scraper.js";
import { getSecretStore } from "../store/secret.js";

export interface TwitterCredentials {
  readonly username: string;
  readonly password: string;
  readonly email: string;
  readonly cookies: TwitterCookies | null;
}

export interface TwitterCookies {
  readonly JSONString: string;
}

export interface LoginResult {
  readonly success: boolean;
  readonly message: string | null;
}

export const getCredentials = async (): Promise<TwitterCredentials | null> => {
  const secretStore = getSecretStore();

  const twitterUsername = await secretStore.get("twitter-username");
  const twitterPassword = await secretStore.get("twitter-password");
  const twitterEmail = await secretStore.get("twitter-email");
  const twitterCookies = await secretStore.get("twitter-cookies");

  if (!twitterUsername || !twitterPassword || !twitterEmail) {
    return null;
  }

  const tc: TwitterCredentials = {
    username: twitterUsername,
    password: twitterPassword,
    email: twitterEmail,
    cookies: twitterCookies ? { JSONString: twitterCookies } : null,
  };

  return tc;
};

export const login = async (tc: TwitterCredentials): Promise<LoginResult> => {
  const scraper = getScraper();
  if (await scraper.isLoggedIn()) {
    return { success: true, message: "Already logged in." };
  }
  const authMethod = tc.cookies ? "cookies" : "password";

  switch (authMethod) {
    // if we found cached cookies we verify their validity and avoid login with credentials
    // if cookies are not valid we return an error
    case "cookies":
      if (!tc.cookies) {
        return { success: false, message: "Cookies cannot be null" };
      }

      // TODO: Should implement a proper interface for a Cookie object
      const parsedCookies: string[] = JSON.parse(tc.cookies.JSONString).map(
        (cookie: any) =>
          `${cookie.key}=${cookie.value}; domain=.twitter.com; path=/`,
      );

      await scraper.setCookies(parsedCookies);
      const isLoggedIn = await scraper.isLoggedIn();

      return {
        success: isLoggedIn ?? false,
        message: isLoggedIn ? null : "Failed to log in with cookies",
      };
    // if no cached cookies are found we login through username, email and password
    // if login goes through we save session cookies to .env for next sessions to avoid login again
    case "password":
      try {
        await scraper.login(tc.username, tc.password, tc.email);

        const isLoggedIn = await scraper.isLoggedIn();

        const cookies = await scraper.getCookies();
        const safeStore = getSecretStore();
        await safeStore.set("twitter-cookies", JSON.stringify(cookies));

        return {
          success: isLoggedIn ?? false,
          message: isLoggedIn
            ? null
            : "Failed to log in with username and password",
        };
      } catch (error: any) {
        return { success: false, message: error };
      }
    default:
      return { success: false, message: "Invalid login method." };
  }
};
