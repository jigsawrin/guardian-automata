import base64
with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('loadSprite("girl", "data:image/png;base64,')
if idx != -1:
    idx += len('loadSprite("girl", "data:image/png;base64,')
    end_idx = text.find('"', idx)
    b64_str = text[idx:end_idx]
    
    try:
        img_data = base64.b64decode(b64_str)
        print("Decoded length:", len(img_data))
        print("First 16 bytes:", img_data[:16])
        with open('girl_test.png', 'wb') as f:
            f.write(img_data)
        print("Saved to girl_test.png")
    except Exception as e:
        print("Error decoding:", e)
else:
    print('Not found')
