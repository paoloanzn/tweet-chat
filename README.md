# Tweet Chat

A command-line tool to scrape Twitter profiles, distill tweets, and generate AI-driven personas for interactive chat based on Twitter accounts. It uses modern AI models to analyze tweet content and simulate conversations as if you were chatting with the Twitter account holder.

## Features

- **Twitter Scraping**: Authenticate with Twitter credentials, scrape user profiles and tweets, and save them to a JSON file.
- **Persona Generation**: Analyze scraped tweets to create a persona using AI models (e.g., OpenAI's GPT models) for realistic chat simulation.
- **Interactive Chat**: Engage in conversations with the generated persona, mimicking the Twitter account's style and tone.
- **Tweet Generation**: Generate original content using scraped tweets to role-play as a specific account.
- **Caching**: Cache personas to avoid redundant AI processing for unchanged profiles.
- **Cross-Platform**: Run natively or via Docker, with precompiled binaries for macOS, Linux, and Windows.
- **CLI Interface**: Interactive prompts for easy configuration of usernames, tweet counts, and AI model settings.

## Prerequisites

- **Bun**: A fast JavaScript runtime (install from [bun.sh](https://bun.sh/)).
- **Docker**: Optional, for containerized execution (install from [docker.com](https://www.docker.com/)).
- **Twitter Credentials**: Username, password, and email for scraping tweets.
- **OpenAI API Key**: Required for AI persona generation and chat (set as `OPENAI_API_KEY` in `.env`).

## Installation

### Automated Installation

Download and install the latest binary for your platform:

```bash
curl -fsSL https://raw.githubusercontent.com/paoloanzn/tweet-chat/main/install.sh | bash
```

This installs the `tweet-chat` binary to `/usr/local/bin`.

### Manual Installation

1. Clone the repository:

```bash
git clone https://github.com/paoloanzn/tweet-chat.git
```

2. Navigate to the project directory:

```bash
cd tweet-chat 
```

3. Install dependencies:

```bash
bun install
```

### Docker Installation

Build and run with Docker Compose:

```bash
docker-compose up
```

## Configuration

Create a `.env` file in the project root with the following:

```
TWITTER_USERNAME=your_twitter_username
TWITTER_PASSWORD=your_twitter_password
TWITTER_EMAIL=your_twitter_email
OPENAI_API_KEY=your_openai_api_key
```

- Twitter credentials are used for scraping and saved cookies are stored in `.env` for reuse.
- The OpenAI API key is required for AI features.

## Usage

Run the tool via the CLI with Bun or as a binary:

```bash
tweet-chat --username <twitter_username> [--tweets <number_of_tweets>] [--scrape] [--no-cache] [--generate-tweet]
```

### Options

- `--username <twitter_username>`: The Twitter username to analyze (e.g., `@elonmusk`).
- `--tweets <number_of_tweets>`: Maximum number of tweets to scrape (default: 10, max: 300).
- `--scrape`: Scrape tweets and save to a JSON file without generating a persona or starting a chat.
- `--no-cache`: Ignore cached personas and regenerate a new one.
- `--generate-tweet`: Generate a tweet(s) using scraped tweets without generating a persona or starting a chat.

### Interactive Mode

If `--username` or `--tweets` are omitted, the CLI prompts for input, including AI model and provider selection (e.g., OpenAI's `gpt-4o`).

### Example

Scrape 20 tweets and chat with the persona:

```bash
tweet-chat --username paoloanzn --tweets 20
```

This:
1. Logs in to Twitter.
2. Scrapes up to 20 tweets and the profile of `@paoloanzn`.
3. Saves the data to `paoloanzn.distilled.json`.
4. Generates a persona using the selected AI model.
5. Starts an interactive chat session.

Scrape only (no chat):

```bash
tweet-chat --username paoloanzn --tweets 20 --scrape
```

### Docker Usage

Run with Docker Compose, passing arguments:

```bash
docker-compose run cli bun src/index.ts --username paoloanzn --tweets 20
```

## Output

- **Scraped Data**: Saved as `<username>.distilled.json` with the profile and tweets.
- **Persona**: Cached in the `cache/` directory as a JSON file, reused unless `--no-cache` is specified.
- **Chat**: Interactive session in the terminal, with responses streamed from the AI model.

## Development

### Scripts

- Format code: `bun run format`
- Run in development: `bun run dev`
- Cross-compile binaries: `bun run cross-compile`

### Project Structure

- `src/twitter/`: Handles Twitter login, scraping, and tweet distillation.
- `src/ai/`: Manages AI model integration and persona generation.
- `src/cli/`: Provides the interactive CLI interface.
- `src/utils/`: Includes logging, caching, and environment utilities.
- `src/index.ts`: Main entry point orchestrating the workflow.

### Building Binaries

Compile binaries for multiple platforms:

```bash
bun run cross-compile
```

Outputs binaries to the `out/` directory for macOS (arm64/x64), Linux (arm64/x64), and Windows (x64).

## Notes

- The project uses the `agent-twitter-client` library for scraping, which may require updates for Twitter API changes.
- AI model support is currently limited to OpenAI (`gpt-4.1`, `gpt-4o`, `gpt-4.5`).
- Persona caching is based on the username and the latest tweet ID to ensure freshness.
- Maximum tweets are capped at 300 to balance performance and API limits.
- This project is actively developed, and features may evolve. Check [GitHub](https://github.com/paoloanzn/tweet-chat) for updates.

## License

MIT License. See [LICENSE](LICENSE) for details.