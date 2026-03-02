import base64
import os
import re
from PIL import Image
from rembg import remove
import io

img_path = r'C:\Users\nuies\.gemini\antigravity\brain\35f37d89-f0cd-46a0-a03e-a6f294b6bfbe\girl_spritesheet_1771863041161.png'
print(f"Processing {img_path}")
with open(img_path, 'rb') as i:
    input_data = i.read()

output_data = remove(input_data)
img = Image.open(io.BytesIO(output_data)).convert("RGBA")

# Crop bbox
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)
    print(f"Cropped to {bbox}")

buffered = io.BytesIO()
img.save(buffered, format="PNG")
b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the girl_b64 string 
pattern1 = r'(const\s+girl_b64\s*=\s*"data:image/png;base64,).*?(;)'
if re.search(pattern1, html, flags=re.DOTALL):
    html = re.sub(pattern1, rf'\g<1>" + "{b64}"\g<2>', html, flags=re.DOTALL)
    print("Replaced girl_b64")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Done")
