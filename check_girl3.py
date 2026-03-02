with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('loadSprite("girl"')
if idx != -1:
    idx2 = text.find('loadSprite', idx+10)
    if idx2 == -1: idx2 = idx + 200000
    chunk = text[idx:idx2]
    # find the end of the base64 string
    quote_idx = chunk.find('"', 20) # find the closing quote of the base64 string
    print(chunk[quote_idx-20:quote_idx+200])
