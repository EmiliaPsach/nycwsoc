#!/bin/bash

# Attempt to build without CocoaPods (for testing)

echo "🚀 Attempting to build NYCWSOC without CocoaPods..."
echo ""

# First verify our React setup is correct
echo "📦 Verifying React setup:"
if [ -f "node_modules/react/package.json" ]; then
    REACT_VERSION=$(node -e "console.log(require('./node_modules/react/package.json').version)")
    echo "   React version: $REACT_VERSION"
else
    echo "   ❌ React not found in node_modules"
    exit 1
fi

# Check if we have node_modules properly installed
echo ""
echo "📦 Node modules status:"
if [ -d "node_modules" ]; then
    MODULE_COUNT=$(ls node_modules | wc -l | tr -d ' ')
    echo "   ✅ Node modules exist ($MODULE_COUNT packages)"
else
    echo "   ❌ Node modules missing - run npm install"
    exit 1
fi

# Try to start Metro bundler first
echo ""
echo "🚀 Starting Metro bundler..."
npx react-native start --reset-cache &
METRO_PID=$!
echo "   Metro PID: $METRO_PID"

# Wait a moment for Metro to start
sleep 3

echo ""
echo "📱 Attempting iOS build..."
echo "   Note: This may fail without CocoaPods, but will show specific errors"

# Try the build
npx react-native run-ios --verbose

# Stop Metro
echo ""
echo "🛑 Stopping Metro bundler..."
kill $METRO_PID 2>/dev/null || true

echo ""
echo "📋 Build attempt complete!"
echo ""
echo "🔧 If build failed due to missing Pods:"
echo "   Need to resolve Ruby/CocoaPods installation first"
echo "   Consider using Homebrew to install Ruby/CocoaPods:"
echo "   brew install ruby && gem install cocoapods"
echo ""