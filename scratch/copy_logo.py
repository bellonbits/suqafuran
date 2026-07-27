import shutil
import os

src = "/Users/mac/Downloads/suuq-removebg-preview.png"
dst = "/Users/mac/suqafuran/public/suuq-removebg-preview.png"

try:
    shutil.copy2(src, dst)
    print(f"Successfully copied {src} to {dst}")
except Exception as e:
    print(f"Error: {e}")
