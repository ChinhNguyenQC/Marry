"""
Small helper to regenerate images.json from the img/ folder.
Run from the project root (c:\Folder_Working\Marry) with Python 3:

python .\scripts\generate_images_json.py

This writes/overwrites images.json with a list of image filenames found in img/.
It filters common image extensions and sorts names for determinism.
"""
import os
import json

ROOT = os.path.dirname(os.path.dirname(__file__))
IMG_DIR = os.path.join(ROOT, 'img')
OUT_FILE = os.path.join(ROOT, 'images.json')

EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp', '.svg'}

if not os.path.isdir(IMG_DIR):
    print('img/ directory not found at', IMG_DIR)
    raise SystemExit(1)

files = [f for f in os.listdir(IMG_DIR) if os.path.splitext(f)[1].lower() in EXTS]
files.sort()

with open(OUT_FILE, 'w', encoding='utf-8') as fh:
    json.dump(files, fh, indent=2, ensure_ascii=False)

print(f'Wrote {len(files)} entries to', OUT_FILE)
