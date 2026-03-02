import sys

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

target = 'loadSprite("girl", "iVBORw0KGgo'
replacement = 'loadSprite("girl", "data:image/png;base64,iVBORw0KGgo'

if target in text:
    new_text = text.replace(target, replacement)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("Fixed loadSprite('girl') prefix.")
else:
    print("Target string not found.")
