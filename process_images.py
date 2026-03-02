import base64
import os
import re
from PIL import Image
from rembg import remove
import io

def process_image(img_path):
    print(f"Processing {img_path}")
    with open(img_path, 'rb') as i:
        input_data = i.read()
    
    # Remove background
    output_data = remove(input_data)
    img = Image.open(io.BytesIO(output_data)).convert("RGBA")
    
    # Crop to bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        print(f"Cropped to {bbox}")
    else:
        print("No bounding box found (empty image?)")
    
    # Save back to bytes
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

# The assets to process
paths = {
    'player': 'assets/player.png',
    'girl': 'assets/girl.png',
    'enemy': 'assets/enemy.png',
    'scrap': 'assets/scrap.png',
    'obs_ruins': r'C:\Users\nuies\.gemini\antigravity\brain\35f37d89-f0cd-46a0-a03e-a6f294b6bfbe\obs_ruins_1771833906794.png',
    'obs_car': r'C:\Users\nuies\.gemini\antigravity\brain\35f37d89-f0cd-46a0-a03e-a6f294b6bfbe\obs_car_1771833925203.png',
    'obs_playground': r'C:\Users\nuies\.gemini\antigravity\brain\35f37d89-f0cd-46a0-a03e-a6f294b6bfbe\obs_playground_1771833949000.png',
    'obs_ground': r'C:\Users\nuies\.gemini\antigravity\brain\35f37d89-f0cd-46a0-a03e-a6f294b6bfbe\obs_ground_1771833967916.png'
}

base64_data = {}
for name, p in paths.items():
    if os.path.exists(p):
        base64_data[name] = process_image(p)
    else:
        print(f"Missing {p}")

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

for name, b64 in base64_data.items():
    if name in ['player', 'girl', 'enemy', 'scrap']:
        pattern1 = rf'(const\s+{name}_b64\s*=\s*"data:image/png;base64,).*?(;)'
        if re.search(pattern1, html, flags=re.DOTALL):
            html = re.sub(pattern1, rf'\g<1>" + "{b64}"\g<2>', html, flags=re.DOTALL)
            print(f"Replaced {name}_b64")
        else:
            print(f"Could not find {name}_b64 in html")
    else:
        pattern2 = rf'(loadSprite\("{name}"\s*,\s*"data:image/png;base64,).*?("\s*\)\s*;)'
        if re.search(pattern2, html, flags=re.DOTALL):
            html = re.sub(pattern2, rf'\g<1>{b64}\g<2>', html, flags=re.DOTALL)
            print(f"Replaced loadSprite for {name}")
        else:
            print(f"Could not find loadSprite for {name}")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Done")
