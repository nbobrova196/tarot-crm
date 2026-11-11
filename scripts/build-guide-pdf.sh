#!/usr/bin/env bash
# Собирает РУКОВОДСТВО.pdf из РУКОВОДСТВО.md.
# Нужны pandoc и weasyprint (macOS: brew install pandoc weasyprint).

set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v pandoc >/dev/null 2>&1; then
  echo "Не найден pandoc. Установите: brew install pandoc" >&2
  exit 1
fi

if ! command -v weasyprint >/dev/null 2>&1; then
  echo "Не найден weasyprint. Установите: brew install weasyprint" >&2
  exit 1
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

python3 scripts/prepare-guide-images.py \
  РУКОВОДСТВО.md \
  "$tmpdir/guide.md" \
  "$tmpdir/images"

pandoc "$tmpdir/guide.md" \
  --from markdown+pipe_tables \
  --to html5 \
  --standalone \
  --metadata pagetitle="Таро — рабочее место. Руководство пользователя" \
  --metadata lang=ru \
  --lua-filter scripts/guide-ids.lua \
  --css scripts/guide-print.css \
  --embed-resources \
  --output "$tmpdir/guide.html"

weasyprint "$tmpdir/guide.html" РУКОВОДСТВО.pdf

echo "Готово: РУКОВОДСТВО.pdf ($(du -h РУКОВОДСТВО.pdf | cut -f1))"
