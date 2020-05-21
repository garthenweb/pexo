#!/usr/bin/env bash

echo
echo "Cleaning up..."
echo

rm -rf packages/cli/bin packages/request/lib packages/utils/lib packages/request/lib packages/core/lib

echo
echo "Building default targets..."
echo

npx parcel build --no-cache --no-minify ./packages/cli ./packages/request ./packages/utils ./packages/core

echo
echo "Generating remaining types..."
echo

npx tsc --declaration --downlevelIteration --target esnext --lib esnext,DOM,DOM.Iterable --emitDeclarationOnly --declarationDir packages/core/lib --jsx preserve --esModuleInterop --strict --suppressImplicitAnyIndexErrors --downlevelIteration --types node packages/core/src/core.ts

echo
echo "Done!"
echo
