#!/bin/bash

set -e

REPO="paoloanzn/tweet-chat"
INSTALL_DIR="/usr/local/bin"
BINARY_NAME="tweet-chat"

# Detect OS and architecture
OS=$(uname -s)
ARCH=$(uname -m)

# Handle Windows (e.g., Git Bash or Cygwin)
if [[ "$OS" == MINGW* ]] || [[ "$OS" == CYGWIN* ]]; then
  echo "For Windows, please download the 'tweet-chat-windows-x64.exe' binary from the GitHub releases page: https://github.com/$REPO/releases"
  exit 1
fi

# Determine the binary based on OS and architecture
if [ "$OS" = "Darwin" ]; then
  if [ "$ARCH" = "arm64" ]; then
    BINARY="tweet-chat-darwin-arm64"
  elif [ "$ARCH" = "x86_64" ]; then
    BINARY="tweet-chat-darwin-x64"
  else
    echo "Unsupported architecture: $ARCH"
    exit 1
  fi
elif [ "$OS" = "Linux" ]; then
  if [ "$ARCH" = "aarch64" ]; then
    BINARY="tweet-chat-linux-arm64"
  elif [ "$ARCH" = "x86_64" ]; then
    BINARY="tweet-chat-linux-x64"
  else
    echo "Unsupported architecture: $ARCH"
    exit 1
  fi
else
  echo "Unsupported OS: $OS"
  exit 1
fi

# Get the latest release tag from GitHub API
LATEST_TAG=$(curl -s https://api.github.com/repos/$REPO/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$LATEST_TAG" ]; then
  echo "Failed to get the latest release tag."
  exit 1
fi

DOWNLOAD_URL="https://github.com/$REPO/releases/download/$LATEST_TAG/$BINARY"

echo "Downloading $BINARY from $DOWNLOAD_URL"
curl -L -o $BINARY_NAME $DOWNLOAD_URL

echo "Moving binary to $INSTALL_DIR. You may be prompted for your password."
sudo mv $BINARY_NAME $INSTALL_DIR/

sudo chmod +x $INSTALL_DIR/$BINARY_NAME

echo "Installation complete. You can now run 'tweet-chat' from the command line."