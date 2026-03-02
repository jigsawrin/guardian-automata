import base64
import os
import re

bgPath = r'C:\Users\nuies\.gemini\antigravity\brain\35f37d89-f0cd-46a0-a03e-a6f294b6bfbe\bg_wasteland_detailed_1771849003675.png'
print(f"Reading {bgPath}")
with open(bgPath, 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

pattern = rf'(const\s+map2_b64\s*=\s*"data:image/png;base64,).*?(;)'
html = re.sub(pattern, rf'\g<1>" + "{b64}"\g<2>', html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Map updated")
