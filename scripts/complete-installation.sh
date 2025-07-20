#!/bin/bash

# Complete the installation process after package.json modifications

echo "🚀 Completing NYCWSOC installation with fixed versions..."
echo ""

# Step 1: Install Node dependencies with resolutions
echo "📦 Installing Node dependencies with React 18.2.0..."
npm install
echo "✅ Node dependencies installed"

# Step 2: Install CocoaPods dependencies
echo ""
echo "📦 Installing CocoaPods dependencies..."
cd ios
pod install
cd ..
echo "✅ CocoaPods dependencies installed"

# Step 3: Clear caches
echo ""
echo "🧹 Clearing build caches..."
npx react-native clean 2>/dev/null || echo "   React Native clean not available, continuing..."
rm -rf ~/Library/Developer/Xcode/DerivedData/NYCWSOC-* 2>/dev/null || true
echo "✅ Caches cleared"

# Step 4: Verify installation
echo ""
echo "🔍 Verifying installation..."
./verify-fixes.sh

echo ""
echo "🎉 Installation complete!"
echo ""
echo "🚀 Ready to build:"
echo "   npx react-native run-ios"
echo ""