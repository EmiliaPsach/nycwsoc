# Building and Running

## IOS

Either automatically run all commands using 1 script, or manually enter them.

### Automatic script:

**Prereq**: Only once, run this to make it executable: `chmod +x scripts/build_and_run_ios.sh`

1. `./scripts/build_and_run_ios.sh`

### Manual commands:

1. If you add packages (via `npm install`), then you **need** to run:
    - `cd ios && pod install && cd ..`
1. Build and run app on simulator: `npx react-native run-ios`

## Android

I haven't yet attempted the Android simulator.