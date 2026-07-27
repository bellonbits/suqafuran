#!/bin/zsh

# Fail on any error
set -e

echo "--- Starting ci_post_clone.sh ---"

# The current directory is where the script is located: /ios/App/ci_scripts
# Move to the project root
cd ../../..

echo "--- Current Directory: $(pwd) ---"

# Step 1: Install Node.js dependencies
echo "--- Installing Node.js dependencies ---"
npm ci

# Step 2: Build the web application
echo "--- Building the web application ---"
npm run build

# Step 3: Synchronize with Capacitor
echo "--- Syncing with Capacitor (iOS) ---"
npx cap sync ios

# Step 4: Install CocoaPods
# Xcode Cloud typically handles this automatically if a Podfile is present,
# but we run it to ensure the latest Capacitor native components are linked.
echo "--- Installing CocoaPods ---"
cd ios/App
pod install

echo "--- ci_post_clone.sh completed successfully ---"
