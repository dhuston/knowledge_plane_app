#!/bin/bash

# Function to count non-empty lines (excluding comments) in different file types
count_lines() {
  local file="$1"
  local extension="${file##*.}"
  
  case "$extension" in
    py)
      # Count non-empty lines excluding Python comments
      grep -v '^\s*#' "$file" | grep -v '^\s*$' | wc -l
      ;;
    ts|tsx|js|jsx)
      # Count non-empty lines excluding JS/TS comments
      grep -v '^\s*//' "$file" | grep -v '^\s*$' | wc -l
      ;;
    md|txt)
      # Count non-empty lines in markdown/text files
      grep -v '^\s*$' "$file" | wc -l
      ;;
    *)
      # Generic count for other file types
      grep -v '^\s*$' "$file" | wc -l
      ;;
  esac
}

# Find all files with code extensions
find . -type f \( -name "*.py" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.md" -o -name "*.css" -o -name "*.html" \) -not -path "*/node_modules/*" -not -path "*/.git/*" | sort | while read file; do
  lines=$(count_lines "$file")
  printf "%-80s %5d lines\n" "$file" "$lines"
done

# Summary by file type
echo -e "\n=== Summary by file type ==="
find . -type f \( -name "*.py" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.md" -o -name "*.css" -o -name "*.html" \) -not -path "*/node_modules/*" -not -path "*/.git/*" | sort | while read file; do
  extension="${file##*.}"
  echo "$extension $(count_lines "$file")"
done | awk '{ext[$1] += $2} END {for (e in ext) print e ": " ext[e] " lines"}'