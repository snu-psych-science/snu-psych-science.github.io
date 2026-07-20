#!/bin/sh
set -eu

exec bundle exec jekyll serve \
  --force_polling \
  --livereload \
  --trace \
  --host=0.0.0.0
