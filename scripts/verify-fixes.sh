#!/bin/bash

# Quick verification script to check if issues are resolved

echo "🔍 Verifying NYCWSOC build fixes..."
echo ""

# Check React version
echo "📦 React Versions:"
if [ -f "node_modules/react/package.json" ]; then
    REACT_VERSION=$(node -e "console.log(require('./node_modules/react/package.json').version)" 2>/dev/null || echo "Error reading")
else
    REACT_VERSION="Not installed"
fi

RN_VERSION=$(grep '"react-native"' package.json | sed 's/.*"react-native": *"\([^"]*\)".*/\1/')
PACKAGE_REACT_VERSION=$(grep '"react"' package.json | sed 's/.*"react": *"\([^"]*\)".*/\1/')

echo "   React (package.json): $PACKAGE_REACT_VERSION"
echo "   React (installed): $REACT_VERSION"
echo "   React Native: $RN_VERSION"

if [[ "$PACKAGE_REACT_VERSION" =~ ^18\. ]] || [[ "$REACT_VERSION" =~ ^18\. ]]; then
    echo "   ✅ Compatible React version configured"
else
    echo "   ⚠️  React version may still be incompatible"
fi

# Check React instances
echo ""
echo "🔍 React Instance Count:"
if [ -d "node_modules" ]; then
    REACT_COUNT=$(find node_modules -name "react" -type d | wc -l | tr -d ' ')
    echo "   Found $REACT_COUNT React instances"
    
    if [ "$REACT_COUNT" -lt 20 ]; then
        echo "   ✅ Reasonable number of React instances"
    else
        echo "   ⚠️  Still many React instances ($REACT_COUNT)"
    fi
else
    echo "   ⚠️  node_modules not found - need to run npm install"
fi

# Check Pods
echo ""
echo "📦 CocoaPods Status:"
if [ -d "ios/Pods" ]; then
    POD_COUNT=$(ls ios/Pods | wc -l | tr -d ' ')
    echo "   ✅ Pods directory exists ($POD_COUNT pods)"
    
    if [ -d "ios/Pods/hermes-engine" ]; then
        echo "   ✅ Hermes engine found"
    else
        echo "   ⚠️  Hermes engine not found"
    fi
else
    echo "   ❌ Pods directory missing"
fi

# Check workspace
echo ""
echo "🏗️  Workspace Status:"
if [ -f "ios/NYCWSOC.xcworkspace/contents.xcworkspacedata" ]; then
    echo "   ✅ Xcode workspace exists"
else
    echo "   ❌ Xcode workspace missing or corrupted"
fi

# Check for package resolutions
echo ""
echo "📋 Package Resolutions:"
if grep -q '"resolutions"' package.json; then
    echo "   ✅ Package resolutions configured"
else
    echo "   ⚠️  No package resolutions found"
fi

echo ""
echo "🚀 Ready to build? Try:"
echo "   npx react-native run-ios"
echo ""
echo "🔧 If still failing:"
echo "   ./open-xcode.sh  (to see detailed errors)"
echo "   ./disable-hermes.sh  (to try with JSC)"
echo ""