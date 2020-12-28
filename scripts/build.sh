#!/usr/bin/env bash

echo
echo "Cleaning up..."
echo

rm -rf packages/cli/bin packages/request/lib packages/utils/lib packages/core/lib

echo
echo "Building default targets..."
echo

npx parcel build --no-cache --no-minify ./packages/cli ./packages/request ./packages/utils ./packages/core

echo
echo "Done!"
echo
