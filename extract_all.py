import sys, re, base64, os

if not os.path.exists('assets'):
    os.makedirs('assets')

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

count = 0
def replacer(match):
    global count
    sprite_name = match.group(1)
    b64_str = match.group(2)
    
    # Extract just the base64 part
    prefix_match = re.search(r'data:image/[a-zA-Z]+;base64,', b64_str)
    if prefix_match:
        b64_data = b64_str[len(prefix_match.group(0)):]
    else:
        b64_data = b64_str
    
    try:
        img_data = base64.b64decode(b64_data)
        file_path = f'assets/{sprite_name}.png'
        with open(file_path, 'wb') as img_file:
            img_file.write(img_data)
        print(f"Saved {file_path}")
        count += 1
        return f'loadSprite("{sprite_name}", "{file_path}"'
    except Exception as e:
        print(f"Error decoding {sprite_name}: {e}")
        return match.group(0)

new_text = re.sub(r'loadSprite\(\"([^\"]+)\",\s*\"([^\"]+)\"', replacer, text)

# There are also variables like map1_b64
def replacer_const(match):
    global count
    var_name = match.group(1)
    b64_str = match.group(2)
    
    # remove the map1_b64 suffix to get sprite name if needed, but here let's just save it.
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
        print(f"Saved {file_path}")
        count += 1
        return f'const {var_name} = "{file_path}";'
    except Exception as e:
        print(f"Error decoding {var_name}: {e}")
        return match.group(0)

# Replace const map1_b64 = "data:image/jpeg;base64," + "..."
# Since the format might be tricky, let's just do a simpler search for the consts
# But actually the map variables are split like const map1_b64 = "data:..." + "..."
# So it's easier to just look at loadSprite for now.

with open('index_clean.html', 'w', encoding='utf-8') as f:
    f.write(new_text)

print(f"Extracted {count} sprites.")
