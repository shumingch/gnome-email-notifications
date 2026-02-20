#!/bin/bash

# Get UUID from metadata.json
UUID=$(grep -oP '"uuid":\s*"\K[^"]+' metadata.json)

if [ -z "$UUID" ]; then
    echo "Error: Could not find uuid in metadata.json"
    exit 1
fi

ZIP_FILE="${UUID}.zip"

echo "Creating extension package: ${ZIP_FILE}"

# Remove existing zip if it exists
rm -f "$ZIP_FILE"

# Create the zip file, excluding development and CI directories
zip -r "$ZIP_FILE" . -x \
    "*.git*" \
    "tests/*" \
    "scripts/*" \
    ".github/*" \
    ".vscode/*" \
    ".agent/*" \
    ".gemini/*" \
    "implementation_plan.md" \
    "task.md" \
    "walkthrough.md" \
    ".gitignore" \
    "screenshot.png" \
    "GmailMessageTray@shuming0207.gmail.com/screenshot.png" \
    "*.po" \
    "schemas/gschemas.compiled" \
    "node_modules/*" \
    "*.zip" \
    "run_tests_output.txt" \
    "eslint.config.mjs" \
    "package-lock.json" \
    "package.json"

echo "Successfully created ${ZIP_FILE}"
