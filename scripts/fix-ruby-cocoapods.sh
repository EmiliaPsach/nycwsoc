#!/bin/bash

# Fix Ruby and CocoaPods installation issues

echo "🔧 Fixing Ruby/CocoaPods installation..."
echo ""

# Check if Homebrew is available
if command -v brew >/dev/null 2>&1; then
    echo "✅ Homebrew found"
    
    # Install rbenv for Ruby version management
    echo "📦 Installing Ruby version manager (rbenv)..."
    brew install rbenv ruby-build 2>/dev/null || echo "   rbenv already installed"
    
    # Initialize rbenv
    echo "🔧 Setting up rbenv..."
    echo 'eval "$(rbenv init -)"' >> ~/.zshrc 2>/dev/null || true
    eval "$(rbenv init -)" 2>/dev/null || true
    
    # Install a modern Ruby version
    echo "📦 Installing Ruby 3.1.0..."
    rbenv install 3.1.0 2>/dev/null || echo "   Ruby 3.1.0 already installed"
    rbenv global 3.1.0
    
    # Install CocoaPods with the new Ruby
    echo "📦 Installing CocoaPods with Ruby 3.1.0..."
    gem install cocoapods
    
    echo "✅ Ruby and CocoaPods setup complete"
    
else
    echo "❌ Homebrew not found"
    echo "📋 Manual setup required:"
    echo "1. Install Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo "2. Run this script again"
    echo ""
    echo "🔧 Alternative: Try system Ruby fix..."
    
    # Try fixing system Ruby gems
    echo "   Updating RubyGems..."
    gem update --system --user-install 2>/dev/null || true
    
    # Install missing dependencies
    echo "   Installing missing Ruby dependencies..."
    gem install --user-install securerandom 2>/dev/null || true
    gem install --user-install random-formatter 2>/dev/null || true
    
fi

echo ""
echo "🔍 Testing CocoaPods installation..."
if pod --version >/dev/null 2>&1; then
    POD_VERSION=$(pod --version)
    echo "✅ CocoaPods working: $POD_VERSION"
    
    echo ""
    echo "📦 Installing iOS dependencies..."
    cd ios
    pod install
    cd ..
    
    echo "✅ iOS dependencies installed successfully!"
    
else
    echo "❌ CocoaPods still not working"
    echo ""
    echo "📋 Try these manual steps:"
    echo "1. brew install ruby"
    echo "2. gem install cocoapods" 
    echo "3. cd ios && pod install"
fi

echo ""
echo "🚀 Next steps:"
echo "   npx react-native run-ios"
echo ""