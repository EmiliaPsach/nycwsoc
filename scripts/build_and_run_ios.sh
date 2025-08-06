#!/bin/bash

echo "Running npm install..."
npm install

echo "Installing iOS pods..."
cd ios
pod install
cd ..

echo "Starting Metro bundler in background..."
npx react-native start --reset-cache &
METRO_PID=$!

# Wait a couple seconds for Metro to start
sleep 3

echo "Building and running the app on iOS simulator..."
npx react-native run-ios
if [ $? -ne 0 ]; then
  echo "Failed to build and run the app. Please check for errors."
  kill $METRO_PID
  exit 1
fi

echo "App is running on the iOS simulator."
