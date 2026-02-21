#!/bin/bash
# Run Arabic translation test - no GNOME Shell required
# Must be run from project root
set -e
cd "$(dirname "$0")/.."
export GJS_PATH=".:$GJS_PATH"
echo "Running Arabic translation test..."
exec gjs -m tests/run_translations_runner.js
