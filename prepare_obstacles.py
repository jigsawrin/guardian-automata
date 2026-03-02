import sys
import base64
import re
from PIL import Image
import io

def process_and_get_b64(input_path, target_size, crop_aspect=None):
    img = Image.open(input_path).convert("RGBA")
    
    # Remove white background (Chroma key)
    datas = img.getdata()
    new_data = []
    # Tolerance for "white"
    for item in datas:
        # Check if r, g, b are all high (e.g. > 240)
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0)) # transparent
        else:
            new_data.append(item)
    img.putdata(new_data)
    
    # Crop if aspect ratio is provided
    if crop_aspect is not None:
        w, h = img.size
        # target_w based on height and aspect ratio
        target_w = int(h * crop_aspect)
        left = (w - target_w) // 2
        right = left + target_w
        if left > 0 and right < w:
            img = img.crop((left, 0, right, h))
    
    # Resize
    img = img.resize(target_size, Image.Resampling.LANCZOS)
    
    # Save to buffer
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    
    return 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode('utf-8')

def main():
    # Process images
    print("Processing large obstacle...")
    b64_large = process_and_get_b64(r'C:\Users\nuies\.gemini\antigravity\brain\ad87fedd-6179-42a3-8ad0-8f521c0d4955\obstacle_large_1772111649724.png', (160, 160))
    
    print("Processing character obstacle...")
    b64_character = process_and_get_b64(r'C:\Users\nuies\.gemini\antigravity\brain\ad87fedd-6179-42a3-8ad0-8f521c0d4955\obstacle_character_1772111574864.png', (80, 80))
    
    print("Processing tall obstacle...")
    # Target is 80x200, aspect is 80/200 = 0.4
    b64_tall = process_and_get_b64(r'C:\Users\nuies\.gemini\antigravity\brain\ad87fedd-6179-42a3-8ad0-8f521c0d4955\obstacle_tall_1772111594563.png', (80, 200), crop_aspect=0.4)
    
    # Load index.html
    html_path = 'c:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html'
    with open(html_path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Create JS loadSprite calls
    injection = f'''
        loadSprite("obs_large", "{b64_large}");
        loadSprite("obs_character", "{b64_character}");
        loadSprite("obs_tall", "{b64_tall}");
    '''

    # Inject
    if '// --- INJECTED OBSTACLES ---' in text:
        text = re.sub(r'// --- INJECTED OBSTACLES ---.*?// --- END INJECTED OBSTACLES ---', f'// --- INJECTED OBSTACLES ---\n{injection}\n        // --- END INJECTED OBSTACLES ---', text, flags=re.DOTALL)
    else:
        # Insert right before "// BGM素材の読み込み"
        anchor = '// BGM素材の読み込み'
        if anchor in text:
            injection_block = f"// --- INJECTED OBSTACLES ---\n{injection}\n        // --- END INJECTED OBSTACLES ---\n        "
            text = text.replace(anchor, injection_block + anchor)
        else:
            print("Anchor not found! Could not inject.")
            sys.exit(1)

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(text)

    print("Success! Injected new base64 obstacle sprites with transparent backgrounds into index.html")

if __name__ == "__main__":
    main()
