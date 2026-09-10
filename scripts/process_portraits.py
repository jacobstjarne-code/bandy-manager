#!/usr/bin/env python3
"""Build transparent, tightly framed player portrait PNG assets from originals."""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter, ImageStat


SOURCE_SIZE = 2048
CROP_BOX = (224, 64, 1824, 1664)
MASK_SIZE = 800
OUTPUT_SIZE = 400
BACKGROUND_DISTANCE = 27
BACKGROUND_STEP_DISTANCE = 10
BACKGROUND_CHROMA_DISTANCE = 12


def colour_distance_squared(left: tuple[int, int, int], right: tuple[int, int, int]) -> int:
    return sum((a - b) ** 2 for a, b in zip(left, right))


def chroma_distance_squared(left: tuple[int, int, int], right: tuple[int, int, int]) -> int:
    left_chroma = (left[1] - left[0], left[2] - left[0])
    right_chroma = (right[1] - right[0], right[2] - right[0])
    return sum((a - b) ** 2 for a, b in zip(left_chroma, right_chroma))


def remove_connected_background(image: Image.Image) -> Image.Image:
    rgb = image.convert('RGB')
    width, height = rgb.size
    pixels = rgb.load()

    sample_box = (0, 0, width, max(8, height // 25))
    background = tuple(round(value) for value in ImageStat.Stat(rgb.crop(sample_box)).median)
    limit = BACKGROUND_DISTANCE ** 2

    visited = bytearray(width * height)
    background_mask = Image.new('L', (width, height), 0)
    mask_pixels = background_mask.load()
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int, previous: tuple[int, int, int] | None = None) -> None:
        offset = y * width + x
        if visited[offset]:
            return
        colour = pixels[x, y]
        follows_background = previous is None or colour_distance_squared(colour, previous) <= BACKGROUND_STEP_DISTANCE ** 2
        matches_backdrop = (
            colour_distance_squared(colour, background) <= limit
            and chroma_distance_squared(colour, background) <= BACKGROUND_CHROMA_DISTANCE ** 2
        )
        if follows_background and matches_backdrop:
            visited[offset] = 1
            queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
    # Shoulders reach the lower side edges and use the same grey family as the
    # backdrop. Seeding the whole side therefore lets the flood fill enter the
    # shirt and chew through the collar. The backdrop is connected to the top;
    # side seeds are only needed above shoulder height.
    for y in range(round(height * 0.68)):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        mask_pixels[x, y] = 255
        current = pixels[x, y]
        if x > 0:
            enqueue(x - 1, y, current)
        if x + 1 < width:
            enqueue(x + 1, y, current)
        if y > 0:
            enqueue(x, y - 1, current)
        if y + 1 < height:
            enqueue(x, y + 1, current)

    # Expand the removed field into the source antialias fringe, then feather
    # one output pixel so hair and shoulders stay clean against light or dark UI.
    background_mask = background_mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.0))
    alpha = background_mask.point(lambda value: 255 - value)
    rgba = rgb.convert('RGBA')
    rgba.putalpha(alpha)
    return rgba


def process_portrait(source: Path, destination: Path) -> None:
    with Image.open(source) as original:
        if original.size != (SOURCE_SIZE, SOURCE_SIZE):
            raise ValueError(f'{source}: expected {SOURCE_SIZE}x{SOURCE_SIZE}, got {original.size}')
        working = original.convert('RGB').crop(CROP_BOX)
        working = working.resize((MASK_SIZE, MASK_SIZE), Image.Resampling.LANCZOS)
        transparent = remove_connected_background(working)
        output = transparent.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.Resampling.LANCZOS)
        destination.parent.mkdir(parents=True, exist_ok=True)
        output.save(destination, format='PNG', optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    process_portrait(args.source, args.destination)


if __name__ == '__main__':
    main()
