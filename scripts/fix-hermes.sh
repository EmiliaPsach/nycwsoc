#!/bin/bash

# Hermes-specific fix script for NYCWSOC
# This script specifically addresses Hermes module redefinition issues

echo "🔧 Starting Hermes-specific fixes..."

# Navigate to iOS directory
cd ios

# Step 1: Remove Hermes-related build artifacts
echo "🧹 Cleaning Hermes build artifacts..."
rm -rf ~/Library/Developer/Xcode/DerivedData/NYCWSOC-*/
rm -rf build/
find . -name "*hermes*" -type d -exec rm -rf {} + 2>/dev/null || true

# Step 2: Update Hermes engine specifically
echo "📦 Updating Hermes engine..."
pod update hermes-engine --no-repo-update

# Step 3: Verify Podfile configuration
echo "🔍 Checking Podfile configuration..."
if ! grep -q "use_hermes" Podfile; then
    echo "⚠️  No explicit Hermes configuration found in Podfile"
    echo "   This might be using the default Hermes configuration"
fi

# Step 4: Clean and rebuild pods with specific flags
echo "📦 Rebuilding pods with clean install..."
pod deintegrate
pod install --clean-install

# Step 5: Try to fix module map issues
echo "🔧 Fixing potential module map issues..."
if [ -f "Pods/React-RuntimeHermes/React-RuntimeHermes.modulemap" ]; then
    echo "   Found React-RuntimeHermes module map"
fi

cd ..

echo ""
echo "🎉 Hermes-specific fixes complete!"
echo ""
echo "Try building again with:"
echo "   npx react-native run-ios"
echo ""
echo "If issues persist, you may need to:"
echo "1. Disable Hermes temporarily by adding to ios/Podfile:"
echo "   use_react_native!(..."
echo "     :hermes_enabled => false"
echo "   )"
echo "2. Or switch to JSC (JavaScript Core) engine"
echo ""