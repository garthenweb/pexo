#!/usr/bin/env bash

echo
echo "Cleaning up..."
echo

rm -rf packages/cli/bin packages/request/lib packages/utils/lib packages/request/lib packages/core/lib

echo
echo "Building default targets..."
echo

npx parcel build --no-cache --no-minify ./packages/request ./packages/utils ./packages/core

echo
echo "Buildig main targets..."
echo

npx parcel build --target main --no-cache --no-minify ./packages/cli ./packages/request ./packages/utils ./packages/core

echo
echo "Generating remaining types..."
echo

npx tsc --declaration --emitDeclarationOnly --declarationDir packages/core/lib --jsx preserve --esModuleInterop packages/core/src/core.ts

echo
echo "Done!"
echo
