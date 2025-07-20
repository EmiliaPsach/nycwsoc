#!/bin/bash

# Script to open NYCWSOC project in Xcode properly

echo "🚀 Opening NYCWSOC project in Xcode..."

# Check if Xcode is installed
if ! command -v xcode-select &> /dev/null; then
    echo "❌ Xcode is not installed or not in PATH"
    exit 1
fi

# Open the workspace (not the .xcodeproj file)
open ios/NYCWSOC.xcworkspace

echo "✅ Xcode should now be opening with NYCWSOC.xcworkspace"
echo ""
echo "📋 In Xcode, try these steps:"
echo "1. Select 'NYCWSOC' target in the navigator"
echo "2. Clean Build Folder (⌘+Shift+K)"
echo "3. Build the project (⌘+B)"
echo "4. Check the Issue Navigator (⌘+5) for detailed errors"
echo ""
echo "🔍 Look specifically for:"
echo "- Module 'react_runtime' redefinition errors"
echo "- Missing header files"
echo "- Hermes-related compilation errors"
echo "- CocoaPods integration issues"
echo ""