#!/usr/bin/env python3
"""
Cut the 5 Boys Club characters from the bocce-court source image into
individual transparent PNGs.

Pipeline per boy:
  1. Crop a generous bbox out of the source image
  2. Run briaai/RMBG-1.4 (ONNX) over the crop to produce an alpha mask
  3. Tight-crop to the alpha bbox so the PNG is no bigger than it has to be
  4. Save to public/boys/<id>.png

Run:  python3 scripts/cut-boys.py
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image
from huggingface_hub import hf_hub_download

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "boys" / "lineup-v1.png"  # First clean line-up, well-spaced
OUT_DIR = ROOT / "public" / "boys"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Bounding boxes for the 1536x1024 line-up v1.
# Boys are well-spaced here — pick generous bboxes that don't quite reach
# into the neighbor's silhouette.
BOYS: list[tuple[str, tuple[int, int, int, int]]] = [
    ("pepe",     (60,   80,  380, 990)),
    ("eggplant", (390,  50,  680, 1010)),
    ("maus",     (735,  100, 905, 990)),
    ("burns",    (935,  90,  1210, 990)),
    ("landwulf", (1240, 60,  1520, 990)),
]

MODEL_INPUT = 1024  # RMBG-1.4 expects 1024x1024


def load_session() -> ort.InferenceSession:
    print("Downloading briaai/RMBG-1.4 …", flush=True)
    model_path = hf_hub_download("briaai/RMBG-1.4", "onnx/model.onnx")
    print(f"  -> {model_path}", flush=True)
    return ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])


def preprocess(img: Image.Image) -> np.ndarray:
    img = img.convert("RGB").resize((MODEL_INPUT, MODEL_INPUT), Image.BILINEAR)
    arr = np.array(img).astype(np.float32) / 255.0
    arr = (arr - 0.5) / 1.0
    arr = arr.transpose(2, 0, 1)[None, ...]
    return arr.astype(np.float32)


def postprocess(mask: np.ndarray, size: tuple[int, int]) -> np.ndarray:
    """Mask comes in sigmoid'd 0..1. We push lows to fully transparent and
    pull highs toward fully opaque — sharper edges, clean transparency."""
    m = mask[0, 0]
    # Threshold curve: anything < 0.35 → 0, anything > 0.7 → 1, linear between
    m = np.clip((m - 0.35) / 0.35, 0, 1)
    m = (m * 255).clip(0, 255).astype(np.uint8)
    return np.array(Image.fromarray(m).resize(size, Image.BILINEAR))


def remove_bg(session: ort.InferenceSession, crop: Image.Image) -> Image.Image:
    rgb = crop.convert("RGB")
    inp = preprocess(rgb)
    in_name = session.get_inputs()[0].name
    mask = session.run(None, {in_name: inp})[0]
    alpha = postprocess(mask, rgb.size)

    rgba = np.array(rgb.convert("RGBA"))
    rgba[..., 3] = alpha
    return Image.fromarray(rgba, "RGBA")


def keep_largest_blob(img: Image.Image, alpha_threshold: int = 32) -> Image.Image:
    """Keep only the single largest connected region of alpha. Drops orphan
    slivers (a neighboring boy's shoulder, a stray detail) which are smaller
    disconnected blobs. Implemented as a simple flood-fill BFS."""
    arr = np.array(img)
    alpha = arr[..., 3]
    h, w = alpha.shape
    mask = alpha > alpha_threshold
    if not mask.any():
        return img

    visited = np.zeros_like(mask, dtype=bool)
    best_size = 0
    best_blob: list[tuple[int, int]] | None = None

    # Use scipy if available for speed; otherwise a simple BFS
    try:
        from scipy import ndimage
        labels, n = ndimage.label(mask)
        if n == 0:
            return img
        sizes = ndimage.sum(mask, labels, range(1, n + 1))
        biggest_label = int(np.argmax(sizes)) + 1
        keep = labels == biggest_label
    except ImportError:
        # Manual BFS fallback (slow but works)
        keep = np.zeros_like(mask, dtype=bool)
        for sy in range(h):
            for sx in range(w):
                if not mask[sy, sx] or visited[sy, sx]:
                    continue
                stack = [(sy, sx)]
                blob: list[tuple[int, int]] = []
                while stack:
                    y, x = stack.pop()
                    if y < 0 or x < 0 or y >= h or x >= w: continue
                    if visited[y, x] or not mask[y, x]: continue
                    visited[y, x] = True
                    blob.append((y, x))
                    stack.extend([(y+1, x), (y-1, x), (y, x+1), (y, x-1)])
                if len(blob) > best_size:
                    best_size = len(blob)
                    best_blob = blob
        if best_blob:
            for (y, x) in best_blob:
                keep[y, x] = True

    arr[..., 3] = np.where(keep, alpha, 0)
    return Image.fromarray(arr, "RGBA")


def tight_crop(img: Image.Image, alpha_threshold: int = 8) -> Image.Image:
    """Crop transparent borders away — keep a small breathing margin."""
    arr = np.array(img)
    alpha = arr[..., 3]
    ys, xs = np.where(alpha > alpha_threshold)
    if len(xs) == 0:
        return img
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    pad = 6
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(arr.shape[1] - 1, x1 + pad)
    y1 = min(arr.shape[0] - 1, y1 + pad)
    return img.crop((x0, y0, x1 + 1, y1 + 1))


def main() -> int:
    if not SOURCE.exists():
        print(f"Source image not found: {SOURCE}", file=sys.stderr)
        return 1

    session = load_session()
    src = Image.open(SOURCE)
    print(f"Source size: {src.size}")

    for boy_id, bbox in BOYS:
        print(f"\n— {boy_id}  bbox={bbox}")
        crop = src.crop(bbox)
        cut = remove_bg(session, crop)
        cut = keep_largest_blob(cut)
        cut = tight_crop(cut)
        out_path = OUT_DIR / f"{boy_id}.png"
        cut.save(out_path, optimize=True)
        print(f"   -> {out_path}  size={cut.size}")

    print("\n✓ All five boys cut.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
