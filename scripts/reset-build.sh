#!/bin/bash

# NYCWSOC Hard Reset Build Script
# This script performs a complete clean reset to fix React Native build issues

echo "🚀 Starting NYCWSOC hard reset build process..."

# Step 0: Clean all caches
echo "🧹 Cleaning all React Native and system caches..."
npx react-native clean
rm -rf ~/.npm/_cache/
rm -rf ~/Library/Caches/CocoaPods/
rm -rf ~/Library/Developer/Xcode/DerivedData/*
echo "✅ System caches cleaned"

# Step 1: Clean iOS build artifacts
echo "🧹 Cleaning iOS build artifacts..."
rm -rf ios/build
echo "✅ iOS build folder removed"

# Step 2: Clean Pods and lockfile
echo "🧹 Cleaning CocoaPods dependencies..."
rm -rf ios/Pods
rm -f ios/Podfile.lock
echo "✅ Pods and lockfile removed"

# Step 3: Clean node modules and package-lock
echo "🧹 Cleaning and reinstalling Node modules..."
rm -rf node_modules
rm -f package-lock.json
npm install
echo "✅ Node modules reinstalled"

# Step 4: Update CocoaPods and reinstall dependencies
echo "📦 Updating CocoaPods and installing dependencies..."
sudo gem install cocoapods --force
cd ios
pod repo update
pod install --repo-update --clean-install
cd ..
echo "✅ CocoaPods dependencies installed"

# Step 5: Clean Xcode project and derived data
echo "🧹 Cleaning Xcode project and derived data..."
xcodebuild clean -workspace ios/NYCWSOC.xcworkspace -scheme NYCWSOC
xcodebuild -workspace ios/NYCWSOC.xcworkspace -scheme NYCWSOC -derivedDataPath ~/Library/Developer/Xcode/DerivedData clean
echo "✅ Xcode project cleaned"

# Step 6: Reset React Native cache
echo "🧹 Resetting React Native cache..."
npx react-native start --reset-cache &
METRO_PID=$!
sleep 3
kill $METRO_PID 2>/dev/null
echo "✅ React Native cache reset"

# Step 7: Fix Hermes issues (if any)
echo "🔧 Applying Hermes fixes..."
if [ -f "ios/Pods/hermes-engine" ]; then
    cd ios
    pod update hermes-engine
    cd ..
fi
echo "✅ Hermes configuration checked"

echo ""
echo "🎉 Extended hard reset complete!"
echo ""
echo "Now try building with:"
echo "   npx react-native run-ios"
echo ""
echo "If you still get Hermes errors, try:"
echo "   1. Open Xcode and clean build folder (⌘+Shift+K)"
echo "   2. Delete derived data in Xcode"
echo "   3. Try building directly in Xcode first"
echo ""

# Optional: Ask if user wants to start Metro now
read -p "Do you want to start Metro bundler now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting Metro bundler..."
    npx react-native start --reset-cache
else
    echo "✅ Script complete. Run 'npx react-native start --reset-cache' when ready to develop."
fi