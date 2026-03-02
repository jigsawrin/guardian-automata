import base64
import re

def get_b64(path):
    with open(path, 'rb') as f:
        return 'data:image/png;base64,' + base64.b64encode(f.read()).decode('utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'\"assets/turret\.png(?:\?v=\d+)?\"', f'"{get_b64("assets/turret.png")}"', text)
text = re.sub(r'\"assets/trap\.png(?:\?v=\d+)?\"', f'"{get_b64("assets/trap.png")}"', text)
text = re.sub(r'\"assets/wall\.png(?:\?v=\d+)?\"', f'"{get_b64("assets/wall.png")}"', text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Done injecting base64!')

