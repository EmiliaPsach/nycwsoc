#!/bin/bash

# Script to temporarily disable Hermes and use JSC instead
# This can help isolate Hermes-related build issues

echo "⚠️  This script will temporarily disable Hermes engine"
echo "   and switch to JavaScript Core (JSC) for debugging"
echo ""
read -p "Do you want to continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo "🔄 Disabling Hermes and switching to JSC..."

# Backup original Podfile
cp ios/Podfile ios/Podfile.backup

# Modify Podfile to disable Hermes
cd ios

# Check if use_react_native! line exists and modify it
if grep -q "use_react_native!" Podfile; then
    # Create a temporary Podfile with Hermes disabled
    sed '/use_react_native!/,/)/c\
  use_react_native!(\
    :path => config[:reactNativePath],\
    :hermes_enabled => false,\
    # An absolute path to your application root.\
    :app_path => "#{Pod::Config.instance.installation_root}/../"\
  )' Podfile > Podfile.tmp && mv Podfile.tmp Podfile
    
    echo "✅ Hermes disabled in Podfile"
else
    echo "❌ Could not find use_react_native! in Podfile"
    cd ..
    exit 1
fi

# Clean and reinstall pods
echo "🧹 Cleaning and reinstalling pods..."
rm -rf Pods
rm -f Podfile.lock
pod install

cd ..

echo ""
echo "🎉 Hermes disabled! Now try building:"
echo "   npx react-native run-ios"
echo ""
echo "To re-enable Hermes later, run:"
echo "   mv ios/Podfile.backup ios/Podfile"
echo "   cd ios && pod install"
echo ""