import re
import base64
import os

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

def get_b64(path):
    with open(path, 'rb') as f:
        return 'data:image/png;base64,' + base64.b64encode(f.read()).decode('utf-8')

b64_str = get_b64('assets/girl_spritesheet.png')

girl_load_code = f'''loadSprite("girl", "{b64_str}", {{
            sliceX: 8,
            anims: {{
                idle: {{ from: 0, to: 0, speed: 1, loop: false }},
                yawn: {{ from: 0, to: 3, speed: 2, loop: false }},
                swing: {{ from: 4, to: 7, speed: 4, loop: false }}
            }}
        }});'''

# Remove any existing loadSprite("girl", ...)
# It might be in various broken forms, so we'll try to find it.
# We'll use a conservative regex to find the `loadSprite("girl", ...)` line/block
text = re.sub(r'loadSprite\(\s*[\'"]girl[\'"]\s*,.*?(\);|\}\s*\);)', '', text, flags=re.DOTALL)

# Insert it after "// Load Sprites (Step 4)"
if "// Load Sprites (Step 4)" in text:
    text = text.replace("// Load Sprites (Step 4)", "// Load Sprites (Step 4)\n        " + girl_load_code)
else:
    print("Warning: '// Load Sprites (Step 4)' comment not found! Injecting near the top.")
    # just put it after kaboom()
    text = re.sub(r'(kaboom\(\{.*?\}\);)', r'\1\n        ' + girl_load_code, text, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Successfully injected the correct girl sprite base64 with animation config!")
