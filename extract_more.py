import sys, re, base64, os

with open('index_clean.html', 'r', encoding='utf-8') as f:
    text = f.read()

count = 0
def replacer_const(match):
    global count
    var_name = match.group(1)
    b64_str = match.group(2) + match.group(3)
    
    prefix_match = re.search(r'data:image/[a-zA-Z]+;base64,', b64_str)
    if prefix_match:
        b64_data = b64_str[len(prefix_match.group(0)):]
    else:
        b64_data = b64_str
        
    try:
        img_data = base64.b64decode(b64_data)
        file_path = f'assets/{var_name}.png'
        with open(file_path, 'wb') as img_file:
            img_file.write(img_data)
        print(f'Saved {file_path}')
        count += 1
        return f'const {var_name} = "{file_path}";'
    except Exception as e:
        print(f'Error decoding {var_name}: {e}')
        return match.group(0)

new_text = re.sub(r'const\s+([a-zA-Z0-9_]+_b64)\s*=\s*\"(data:image/[^\"]+)\"\s*\+\s*\"([^\"]+)\";', replacer_const, text)

def replacer_const_single(match):
    global count
    var_name = match.group(1)
    b64_str = match.group(2)
    
    prefix_match = re.search(r'data:image/[a-zA-Z]+;base64,', b64_str)
    if prefix_match:
        b64_data = b64_str[len(prefix_match.group(0)):]
    else:
        b64_data = b64_str
        
    try:
        img_data = base64.b64decode(b64_data)
        file_path = f'assets/{var_name}.png'
        with open(file_path, 'wb') as img_file:
            img_file.write(img_data)
        print(f'Saved {file_path}')
        count += 1
        return f'const {var_name} = "{file_path}";'
    except Exception as e:
        print(f'Error decoding {var_name}: {e}')
        return match.group(0)

new_text = re.sub(r'const\s+([a-zA-Z0-9_]+_b64)\s*=\s*\"(data:image/[^\"]+)\";', replacer_const_single, new_text)

with open('index_clean.html', 'w', encoding='utf-8') as f:
    f.write(new_text)

print(f'Extracted {count} more sprites.')
