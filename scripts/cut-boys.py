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
SOURCE = ROOT / "assets" / "boys" / "HINvzyuW4AAFF4b.jpeg"  # $DISCO promo, club background
OUT_DIR = ROOT / "public" / "boys"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Bounding boxes for the 1200x800 $DISCO promo image.
# Background is a dark disco club — RMBG-1.4 handles this much better than the
# garden in the bocce image (~30-50% foreground vs ~85%).
BOYS: list[tuple[str, tuple[int, int, int, int]]] = [
    ("pepe",     (50,  155, 320, 545)),
    ("eggplant", (290, 130, 525, 565)),
    ("maus",     (530, 130, 760, 460)),
    ("burns",    (705, 165, 895, 585)),
    ("hippie",   (915, 130, 1170, 580)),
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
        cut = tight_crop(cut)
        out_path = OUT_DIR / f"{boy_id}.png"
        cut.save(out_path, optimize=True)
        print(f"   -> {out_path}  size={cut.size}")

    print("\n✓ All five boys cut.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
