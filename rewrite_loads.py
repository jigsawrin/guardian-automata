import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

def fix_map_load(match):
    name = match.group(1).replace('_b64', '')
    path = match.group(2)
    return f'loadSprite("{name}", "{path}");'

text = re.sub(r'const\s+([a-zA-Z0-9_]+_b64)\s*=\s*"([^"]+)";', fix_map_load, text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
print("Finished rewriting const to loadSprite.")
