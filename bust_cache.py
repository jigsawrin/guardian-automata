import re
import time
with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Bust cache
val = str(int(time.time()))
text = re.sub(r'\.png(?:\?v=\d+)?\"', f'.png?v={val}"', text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Cache busted!')

print('Player definition:')
idx = text.find('const player = add([')
print(text[idx:idx+300])
