import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'loadSprite\(\"(.*?)\", *\"(.{0,50})', text):
    print(f'-- {m.group(1)}: {m.group(2)}')
