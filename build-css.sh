#!/usr/bin/env sh
# Builds css/tailwind.css from the classes used in index.html and js/*.js.
# Uses the Tailwind standalone CLI (no Node needed). Download once from:
# https://github.com/tailwindlabs/tailwindcss/releases/tag/v3.4.17  (e.g. tailwindcss-macos-arm64 → rename to ./tailwindcss)
# or, if you have Node: npx tailwindcss@3 -i src/tailwind.input.css -o css/tailwind.css --minify
set -e
BIN=./tailwindcss
[ -x "$BIN" ] || BIN="npx tailwindcss@3"
$BIN -c tailwind.config.js -i src/tailwind.input.css -o css/tailwind.css --minify
