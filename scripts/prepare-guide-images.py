#!/usr/bin/env python3
"""Готовит руководство к PDF: режет длинные скриншоты на страницы.

Pandoc вставляет картинку целиком, а WeasyPrint не умеет разрывать
изображение между страницами — высокий скриншот обрезается. Скрипт
заменяет такие картинки на несколько вертикальных фрагментов с небольшим
перехлёстом. Короткие картинки остаются как есть.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from PIL import Image

IMAGE_RE = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")

CONTENT_WIDTH_MM = 178
SLICE_HEIGHT_MM = 205
OVERLAP_RATIO = 0.04
MIN_LAST_SLICE_RATIO = 0.35


def slice_image(source: Path, out_dir: Path, alt: str) -> list[tuple[Path, str]]:
    with Image.open(source) as image:
        width, height = image.size
        slice_height = int(SLICE_HEIGHT_MM * width / CONTENT_WIDTH_MM)

        if height <= slice_height:
            return [(source, alt)]

        overlap = max(1, int(slice_height * OVERLAP_RATIO))
        step = slice_height - overlap
        starts = list(range(0, height, step))

        # Последний фрагмент не должен быть узкой полоской: сдвигаем его
        # начало так, чтобы он был полной высоты.
        if len(starts) > 1 and height - starts[-1] < slice_height * MIN_LAST_SLICE_RATIO:
            starts[-1] = max(0, height - slice_height)

        parts: list[tuple[Path, str]] = []
        out_dir.mkdir(parents=True, exist_ok=True)
        total = len(starts)

        for index, top in enumerate(starts, start=1):
            bottom = min(height, top + slice_height)
            if index == total:
                bottom = height
            fragment = image.crop((0, top, width, bottom))
            target = out_dir / f"{source.stem}-part-{index:02d}.png"
            fragment.save(target, format="PNG", optimize=True)
            label = alt if total == 1 else f"{alt} — часть {index} из {total}"
            parts.append((target, label))

        return parts


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("image_dir", type=Path)
    args = parser.parse_args()

    markdown = args.source.read_text(encoding="utf-8")

    def replace(match: re.Match[str]) -> str:
        alt, raw_path = match.group(1), match.group(2)
        if raw_path.startswith(("http://", "https://", "data:")):
            return match.group(0)

        source = (args.source.parent / raw_path).resolve()
        if not source.exists():
            return match.group(0)

        parts = slice_image(source, args.image_dir.resolve(), alt)
        return "\n\n".join(
            f"![{label}]({path.as_posix()})" for path, label in parts
        )

    args.output.write_text(IMAGE_RE.sub(replace, markdown), encoding="utf-8")


if __name__ == "__main__":
    main()
