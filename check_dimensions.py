from PIL import Image
import os

assets_path = "c:/Users/nuies/.gemini/antigravity/scratch/guardian-automata/assets/"
files = [f for f in os.listdir(assets_path) if f.endswith(".png")]

for f in files:
    try:
        with Image.open(os.path.join(assets_path, f)) as img:
            print(f"{f}: {img.width}x{img.height}")
    except Exception as e:
        print(f"Error reading {f}: {e}")
