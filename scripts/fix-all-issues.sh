#!/bin/bash

# Comprehensive fix for all identified NYCWSOC build issues

echo "🚀 Starting comprehensive fix for NYCWSOC build issues..."
echo ""

# Issue 1: Missing Pods directory
echo "📦 Step 1: Installing missing Pods..."
cd ios
if [ ! -d "Pods" ]; then
    echo "   Installing CocoaPods dependencies..."
    pod install
    echo "✅ Pods installed"
else
    echo "✅ Pods directory already exists"
fi
cd ..

# Issue 2: React version compatibility (React 19.1.0 with RN 0.80.1)
echo ""
echo "🔧 Step 2: Fixing React version compatibility..."
echo "   Downgrading React from 19.1.0 to 18.2.0 for RN 0.80.1 compatibility"

# Create a temporary package.json with compatible versions
cp package.json package.json.backup

# Update React version to be compatible with RN 0.80.1
npm install react@18.2.0 @types/react@18.2.0 react-test-renderer@18.2.0

echo "✅ React version downgraded to 18.2.0"

# Issue 3: Multiple React instances causing module conflicts
echo ""
echo "🧹 Step 3: Resolving multiple React instances..."

# Add resolution to package.json to force single React version
node -e "
const pkg = require('./package.json');
pkg.resolutions = pkg.resolutions || {};
pkg.resolutions.react = '18.2.0';
pkg.resolutions['@types/react'] = '18.2.0';
pkg.overrides = pkg.overrides || {};
pkg.overrides.react = '18.2.0';
pkg.overrides['@types/react'] = '18.2.0';
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
"

echo "✅ Package.json updated with React resolutions"

# Clean reinstall to apply resolutions
echo ""
echo "🧹 Step 4: Clean reinstall with resolutions..."
rm -rf node_modules
rm -f package-lock.json
npm install

echo "✅ Node modules reinstalled with proper resolutions"

# Issue 4: Reinstall Pods with new React version
echo ""
echo "📦 Step 5: Reinstalling Pods with correct React version..."
cd ios
rm -rf Pods
rm -f Podfile.lock
pod install
cd ..

echo "✅ Pods reinstalled"

# Issue 5: Clear all caches
echo ""
echo "🧹 Step 6: Clearing all caches..."
npx react-native clean
rm -rf ~/Library/Developer/Xcode/DerivedData/NYCWSOC-* 2>/dev/null || true
rm -rf ~/.npm/_cacache/ 2>/dev/null || true

echo "✅ Caches cleared"

# Verify fixes
echo ""
echo "🔍 Step 7: Verifying fixes..."

# Check React version
REACT_VERSION=$(node -e "console.log(require('./node_modules/react/package.json').version)")
echo "   React version now: $REACT_VERSION"

# Check for duplicate React (should be fewer now)
REACT_COUNT=$(find node_modules -name "react" -type d | wc -l | tr -d ' ')
echo "   React instances found: $REACT_COUNT"

# Check if Pods exist
if [ -d "ios/Pods" ]; then
    echo "   ✅ Pods directory exists"
else
    echo "   ❌ Pods directory still missing"
fi

# Check if Hermes is available
if [ -d "ios/Pods/hermes-engine" ]; then
    echo "   ✅ Hermes engine found"
else
    echo "   ⚠️  Hermes engine not found (may use JSC)"
fi

echo ""
echo "🎉 Comprehensive fix complete!"
echo ""
echo "📋 Summary of changes:"
echo "   • React downgraded: 19.1.0 → 18.2.0"
echo "   • Added package resolutions for single React version"
echo "   • Reinstalled all dependencies"
echo "   • Cleared all build caches"
echo ""
echo "🚀 Now try building:"
echo "   npx react-native run-ios"
echo ""
echo "💾 Backup created: package.json.backup"
echo "   (restore with: mv package.json.backup package.json)"
echo ""