with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('loadSprite("girl"')
if idx != -1:
    idx2 = text.find('loadSprite', idx+10)
    if idx2 == -1: idx2 = idx + 200000
    chunk = text[idx:idx2]
    # find where the string literal ends
    print('Chunk length:', len(chunk))
    # print the last 150 chars of the chunk
    print(chunk[-150:])
