#!/usr/bin/env bash

echo
echo "Cleaning up..."
echo

rm -rf packages/cli/bin packages/request/lib packages/utils/lib packages/core/lib

echo
echo "Building default targets..."
echo

npx parcel build --no-minify ./packages/cli ./packages/request ./packages/utils ./packages/core

echo
echo "Assign access rights..."
echo

chmod +x packages/cli/bin/cli.js

echo
echo "Done!"
echo
