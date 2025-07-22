# System Requirements

System Requirements for NYCWSOC React Native iOS Build

## Node.js

- **Version:** >= 18
- **Recommended:** 20.19.4
- **Installation:** Use [nvm](https://github.com/nvm-sh/nvm)

```bash
nvm install 20
nvm use 20
node -v # Should output v20.19.4
```

## React Native

- **React version:** 19.1.0
- **React Native version:** 0.80.1

### Running the iOS app:

```bash
npx react-native run-ios
```

## Ruby Environment

- **Ruby version:** 3.4.5 (installed via rbenv)
- **Important:** Avoid using system Ruby (macOS default 2.6.x)

### Install rbenv and ruby-build:

```bash
brew install rbenv ruby-build
```

### Initialize rbenv in your shell:

Add to `~/.zshrc` or `~/.bash_profile`:

```bash
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc
```

### Install Ruby 3.4.5 with dependencies:

```bash
RUBY_CONFIGURE_OPTS="--with-openssl-dir=/opt/homebrew/opt/openssl@3 --with-libyaml-dir=/opt/homebrew/opt/libyaml --with-readline-dir=/opt/homebrew/opt/readline" rbenv install 3.4.5
rbenv global 3.4.5
rbenv rehash
ruby -v # Should output ruby 3.4.5
```

## OpenSSL

Install via Homebrew:

```bash
brew install openssl@3
```

**Note:** Ensure OpenSSL path is correctly referenced in Ruby build configs.

## CocoaPods

- **Version:** 1.16.2
- **Installation:** Via gem under rbenv-managed Ruby (not system Ruby)

### To uninstall old versions and reinstall:

```bash
sudo gem uninstall cocoapods
gem install cocoapods
rbenv rehash
which pod # Should point to ~/.rbenv/shims/pod
pod --version # Should output 1.16.2
```

### Before running pod install:

```bash
rm -rf Pods Podfile.lock
pod install --repo-update
```

## Xcode and Command Line Tools

- **Xcode version:** 15.0 or later (recommended)
- **Command line tools:** Must be installed
- **Disable rebooting a closed simulation**: Open Simulator -> `Simulator` -> `About Simulator` -> Disable every checkbox in `Simulator lifetime`

```bash
xcode-select --install
```

## Additional Notes

- Ensure your PATH prioritizes rbenv shims for Ruby and CocoaPods
- Use rbenv Ruby environment consistently to avoid conflicts with system Ruby and gems
- Clear `Pods` and `Podfile.lock` and run `pod install --repo-update` when dependencies change or errors arise
- Verify that OpenSSL libraries are properly linked when building Ruby or native extensions