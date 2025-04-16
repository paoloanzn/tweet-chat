# Twitter Analyzer

A tool to analyze Twitter profiles by fetching and saving tweets to a JSON file.

## Prerequisites

- [Bun](https://bun.sh/) installed on your system.
- [Docker](https://www.docker.com/) installed if you plan to run the project inside a container.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/twitter-analyzer.git
```

2. Navigate to the project directory:

```bash
cd twitter-analyzer
```

3. Install dependencies:

```bash
bun install
```

## Usage

Run the analyzer with the following command:

```bash
bun src/index.ts --username <twitter_username> [--tweets <number_of_tweets>]
```

- `<twitter_username>`: The Twitter username to analyze.
- `<number_of_tweets>`: (Optional) The maximum number of tweets to fetch. Defaults to 10.

Example:

```bash
bun src/index.ts --username paoloanzn --tweets 20
```

This fetches up to 20 tweets from "paoloanzn" and saves them to `paoloanzn.distilled.json`.

## Configuration

Create a `.env` file in the project root with:

```
TWITTER_USERNAME=your_twitter_username
TWITTER_PASSWORD=your_twitter_password
TWITTER_EMAIL=your_twitter_email
```

These credentials are used to log in to Twitter. Cookies are saved to `.env` after a successful login for future use.

## Running with Docker

Build and run the container:

```bash
docker-compose up
```

To pass arguments:

```bash
docker-compose run cli bun src/index.ts --username <twitter_username> [--tweets <number_of_tweets>]
```

Example:

```bash
docker-compose run cli bun src/index.ts --username paoloanzn --tweets 20
```

## Note

This project is under development, and features may change.
