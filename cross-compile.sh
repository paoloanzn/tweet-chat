BINARY_NAME="twitter-analyzer"
ENTRYPOINT="src/index.ts"
OUT_FOLDER="./out"

mkdir -p $OUT_FOLDER

echo "Building for Macos Arm64..."
bun build $ENTRYPOINT --compile --target=bun-darwin-arm64 --outfile $OUT_FOLDER/$BINARY_NAME-darwin-arm64

echo "Building for Macos X64..."
bun build $ENTRYPOINT --compile --target=bun-darwin-x64 --outfile $OUT_FOLDER/$BINARY_NAME-darwin-x64

echo "Building for Windows X64.."
bun build $ENTRYPOINT --compile --target=bun-windows-x64 --outfile $OUT_FOLDER/$BINARY_NAME-windows-x64

echo "Building for Linux Arm64..."
bun build $ENTRYPOINT --compile --target=bun-linux-arm64 --outfile $OUT_FOLDER/$BINARY_NAME-linux-arm64

echo "Building for Linux X64..."
bun build $ENTRYPOINT --compile --target=bun-linux-x64 --outfile $OUT_FOLDER/$BINARY_NAME-linux-x64
