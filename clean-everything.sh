#!/usr/bin/env zsh

# Get number of CPU cores in a cross-platform way
if command -v sysctl >/dev/null 2>&1; then
    # macOS
    cores=$(sysctl -n hw.ncpu)
else
    # Linux
    cores=$(nproc || echo 4)
fi

# Define targets to clean
declare -a dirs_to_clean=(
    ".cache"
    ".eslintcache"
    ".next"
    ".turbo"
    "build"
    "coverage"
    "dist"
    "generated"
    "storybook-static"
    "node_modules"
)

declare -a files_to_clean=(
    "*.log"
    "pnpm-lock.yaml"
)

# Convert arrays to find patterns
dirs_pattern=$(printf -- "-name %s -o " "${dirs_to_clean[@]}" | sed 's/ -o $//')
files_pattern=$(printf -- "-name %s -o " "${files_to_clean[@]}" | sed 's/ -o $//')

# Create prune pattern for efficiency
prune_pattern=$(printf -- "-name %s -o " "${dirs_to_clean[@]}" | sed 's/ -o $//')

# Log start with single write
{
    echo "================ Clean Everything ================"
    echo "Starting cleanup process"
    echo "Cleaning directories recursively: ${dirs_to_clean[@]}"
    echo "Cleaning files recursively: ${files_to_clean[@]}"
} | tee >(logger)

# Clean directories at any level
find . -mindepth 1 -type d \( $dirs_pattern \) -print | tr '\n' '\0' | xargs -0 -P $cores rm -rf

# Clean files at any level, excluding directories that were just removed
find . -mindepth 1 \( -type d \( $prune_pattern \) -prune \) -o \
       \( -type f \( $files_pattern \) -print \) | tr '\n' '\0' | xargs -0 -P $cores rm -f

# PNPM store cleanup
{
    echo "Cleaning PNPM store"
    if command -v pnpm >/dev/null 2>&1; then
        pnpm store prune
    else
        echo "PNPM not found, skipping store cleanup"
    fi
} | tee >(logger)

echo "Cleanup complete!"
