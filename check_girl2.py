with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('loadSprite("girl"')
if idx != -1:
    print(text[idx:idx+150])
