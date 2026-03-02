import os
import re
from PIL import Image

def process_and_save(input_path, output_path, target_size, crop_aspect=None):
    try:
        if not os.path.exists(input_path):
            print(f"Error: Could not find image at {input_path}")
            return False

        with Image.open(input_path).convert("RGBA") as img:
            print(f"Original size: {img.size}")
            
            # Simple chroma key to remove pure white background
            # Iterate over pixels
            pixels = img.getdata()
            new_pixels = []
            for item in pixels:
                # If pixel is close to white, make it transparent
                if item[0] > 240 and item[1] > 240 and item[2] > 240:
                    new_pixels.append((255, 255, 255, 0))
                else:
                    new_pixels.append(item)
            img.putdata(new_pixels)

            # Crop if aspect ratio is provided (for tall obstacle)
            if crop_aspect:
                w, h = img.size
                current_aspect = w / h
                if current_aspect > crop_aspect:
                    # Too wide, crop width
                    new_w = int(h * crop_aspect)
                    left = (w - new_w) // 2
                    img = img.crop((left, 0, left + new_w, h))
                    print(f"Cropped to: {img.size}")
            
            # Resize
            img = img.resize(target_size, Image.LANCZOS)
            print(f"Resized to: {img.size}")
            
            # Save to assets folder
            img.save(output_path, "PNG")
            print(f"Saved to {output_path}")
            return True
            
    except Exception as e:
        print(f"Failed to process {input_path}: {e}")
        return False

def main():
    assets_dir = r'c:\Users\nuies\.gemini\antigravity\scratch\guardian-automata\assets'
    os.makedirs(assets_dir, exist_ok=True)

    print("Processing large obstacle...")
    process_and_save(
        r'C:\Users\nuies\.gemini\antigravity\brain\ad87fedd-6179-42a3-8ad0-8f521c0d4955\obstacle_large_1772111649724.png',
        os.path.join(assets_dir, 'obs_large.png'),
        (160, 160)
    )
    
    print("Processing character obstacle...")
    process_and_save(
        r'C:\Users\nuies\.gemini\antigravity\brain\ad87fedd-6179-42a3-8ad0-8f521c0d4955\obstacle_character_1772111574864.png',
        os.path.join(assets_dir, 'obs_character.png'),
        (80, 80)
    )
    
    print("Processing tall obstacle...")
    process_and_save(
        r'C:\Users\nuies\.gemini\antigravity\brain\ad87fedd-6179-42a3-8ad0-8f521c0d4955\obstacle_tall_1772111594563.png',
        os.path.join(assets_dir, 'obs_tall.png'),
        (80, 200),
        crop_aspect=0.4
    )

    # Load index.html and revert base64 injections
    html_path = r'c:\Users\nuies\.gemini\antigravity\scratch\guardian-automata\index.html'
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            text = f.read()

        replacement = '''
        loadSprite("obs_large", "assets/obs_large.png?v=" + Date.now());
        loadSprite("obs_character", "assets/obs_character.png?v=" + Date.now());
        loadSprite("obs_tall", "assets/obs_tall.png?v=" + Date.now());
        '''

        # We will use regex to find and replace the injected block
        if '// --- INJECTED OBSTACLES ---' in text:
            # Replace the whole block
            text = re.sub(r'// --- INJECTED OBSTACLES ---.*?// --- END INJECTED OBSTACLES ---', f'{replacement}', text, flags=re.DOTALL)
            
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(text)
            print("Successfully updated index.html to use external assets.")
        else:
            print("Could not find the injection block in index.html")

    except Exception as e:
        print(f"Error updating index.html: {e}")

if __name__ == "__main__":
    main()
