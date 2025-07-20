#!/bin/bash

# Diagnostic script to identify build issues

echo "🔍 Diagnosing NYCWSOC build issues..."
echo ""

# Check Node.js version
echo "📋 Environment Check:"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo "React Native CLI: $(npx react-native --version 2>/dev/null || echo 'Not found')"
echo "CocoaPods version: $(pod --version 2>/dev/null || echo 'Not found')"
echo "Xcode version: $(xcodebuild -version | head -1 2>/dev/null || echo 'Not found')"
echo ""

# Check if workspace exists
if [ ! -f "ios/NYCWSOC.xcworkspace/contents.xcworkspacedata" ]; then
    echo "❌ Workspace file missing or corrupted"
    echo "   Try running: cd ios && pod install"
    exit 1
else
    echo "✅ Workspace file exists"
fi

# Check for common issues
echo ""
echo "🔍 Checking for common issues:"

# Check for Pods directory
if [ ! -d "ios/Pods" ]; then
    echo "❌ Pods directory missing"
    echo "   Run: cd ios && pod install"
else
    echo "✅ Pods directory exists"
fi

# Check for Hermes engine
if [ -d "ios/Pods/hermes-engine" ]; then
    echo "✅ Hermes engine found"
    echo "   Version: $(ls ios/Pods/hermes-engine/ 2>/dev/null | head -1)"
else
    echo "⚠️  Hermes engine not found in Pods"
fi

# Check React Native version compatibility
echo ""
echo "📦 Package versions:"
RN_VERSION=$(grep '"react-native"' package.json | sed 's/.*"react-native": *"\([^"]*\)".*/\1/')
REACT_VERSION=$(grep '"react"' package.json | sed 's/.*"react": *"\([^"]*\)".*/\1/')
echo "React Native: $RN_VERSION"
echo "React: $REACT_VERSION"

if [[ "$RN_VERSION" == "0.80.1" && "$REACT_VERSION" == "19.1.0" ]]; then
    echo "⚠️  Version mismatch detected!"
    echo "   React 19.1.0 with RN 0.80.1 may cause issues"
    echo "   Consider using React 18.x with RN 0.80.1"
fi

# Check for duplicate React installations
echo ""
echo "🔍 Checking for duplicate React modules..."
REACT_INSTANCES=$(find node_modules -name "react" -type d | wc -l | tr -d ' ')
if [ "$REACT_INSTANCES" -gt 1 ]; then
    echo "⚠️  Multiple React instances found ($REACT_INSTANCES)"
    echo "   This can cause build issues"
    find node_modules -name "react" -type d
else
    echo "✅ Single React instance found"
fi

# Check build logs if they exist
echo ""
echo "📝 Recent build logs:"
if [ -d "~/Library/Developer/Xcode/DerivedData" ]; then
    LATEST_BUILD=$(find ~/Library/Developer/Xcode/DerivedData -name "*NYCWSOC*" -type d | head -1)
    if [ -n "$LATEST_BUILD" ]; then
        echo "   Latest build data: $LATEST_BUILD"
        echo "   Size: $(du -sh "$LATEST_BUILD" 2>/dev/null | cut -f1)"
    else
        echo "   No recent build data found"
    fi
else
    echo "   No Xcode derived data directory"
fi

echo ""
echo "🚀 Recommended next steps:"
echo "1. Run: ./open-xcode.sh"
echo "2. In Xcode: Clean Build Folder (⌘+Shift+K)"
echo "3. Try building (⌘+B)"
echo "4. Check Issue Navigator (⌘+5) for specific errors"
echo ""
echo "If still failing, try:"
echo "- ./disable-hermes.sh (to test with JSC)"
echo "- ./fix-hermes.sh (for Hermes-specific fixes)"
echo ""