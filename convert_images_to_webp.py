"""Convert PNG and JPEG files under assets/images to WebP with FFmpeg.

Run from the repository root with: python convert_images_to_webp.py
"""

import argparse
import os
from pathlib import Path
import shutil
import subprocess
import tempfile


DEFAULT_DIRECTORY = Path(__file__).resolve().parent / "assets" / "images"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--directory",
        type=Path,
        default=DEFAULT_DIRECTORY,
        help="Image directory (default: this repository's assets/images)",
    )
    parser.add_argument(
        "--quality",
        type=int,
        choices=range(101),
        metavar="0-100",
        default=80,
        help="Quality for PNG/JPG/JPEG images (default: 80)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace existing WebP files (default: skip them)",
    )
    args = parser.parse_args()

    directory = args.directory.resolve()
    if not directory.is_dir():
        parser.error(f"Image directory does not exist: {directory}")

    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        parser.error("FFmpeg was not found in PATH. Install it and try again.")

    images = sorted(
        (path for path in directory.rglob("*") if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS),
        key=lambda path: str(path).casefold(),
    )
    if not images:
        print(f"No PNG or JPG/JPEG files found under {directory}")
        return 0

    # Two source files such as photo.png and photo.jpg must not overwrite each other.
    destinations: dict[str, Path] = {}
    for source in images:
        destination = source.with_suffix(".webp")
        key = str(destination).casefold()
        if key in destinations:
            print(f"Name conflict: {destinations[key]} and {source} both map to {destination}")
            return 1
        destinations[key] = source

    converted = skipped = failed = 0
    for source in images:
        destination = source.with_suffix(".webp")
        if destination.exists() and not args.overwrite:
            print(f"Skip (already exists): {destination.relative_to(directory)}")
            skipped += 1
            continue

        fd, temporary_name = tempfile.mkstemp(
            prefix=f".{source.stem}-", suffix=".webp", dir=source.parent
        )
        os.close(fd)
        temporary = Path(temporary_name)
        command = [
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(source), "-frames:v", "1", "-c:v", "libwebp",
            "-lossless", "0", "-quality", str(args.quality),
        ]
        command.append(str(temporary))

        try:
            result = subprocess.run(command, capture_output=True, text=True)
            if result.returncode != 0:
                print(f"Failed: {source.relative_to(directory)}\n{result.stderr.strip()}")
                failed += 1
                continue
            temporary.replace(destination)
            print(f"Converted: {source.relative_to(directory)} -> {destination.relative_to(directory)}")
            converted += 1
        except OSError as error:
            print(f"Failed: {source.relative_to(directory)}\n{error}")
            failed += 1
        finally:
            temporary.unlink(missing_ok=True)

    print(f"Done: {converted} converted, {skipped} skipped, {failed} failed.")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
