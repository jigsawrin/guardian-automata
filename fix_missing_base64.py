import re
import base64
import os

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

def get_b64(path):
    with open(path, 'rb') as f:
        return 'data:image/png;base64,' + base64.b64encode(f.read()).decode('utf-8')

def replacer(match):
    name = match.group(1)
    file_path = match.group(2) # e.g. assets/map1_b64.png
    
    # Special case for girl
    if name == 'girl':
        b64_str = get_b64('assets/girl_spritesheet.png')
        return f'''loadSprite("girl", "{b64_str}", {{
            sliceX: 8,
            anims: {{
                idle: {{ from: 0, to: 0, speed: 1, loop: false }},
                yawn: {{ from: 0, to: 3, speed: 2, loop: false }},
                swing: {{ from: 4, to: 7, speed: 4, loop: false }}
            }}
        }});'''

    if os.path.exists(file_path):
        b64_str = get_b64(file_path)
        print(f"Injected {file_path} for {name}")
        return f'loadSprite("{name}", "{b64_str}");'
    else:
        print(f"Warning: {file_path} not found")
        return match.group(0)

new_text = re.sub(r'loadSprite\(\"([^\"]+)\",\s*\"([^\"]+?\.png)(?:\?[^\"]+)?\"\);', replacer, text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Injection complete!")
