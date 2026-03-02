import sys
import re
with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('loadSprite("girl"')
if idx != -1:
    end_idx = text.find(';', idx)
    full_call = text[idx:end_idx+1]
    # Truncate the huge base64 to see the shape
    b64_match = re.search(r'data:image/png;base64,[A-Za-z0-9+/=]+', full_call)
    if b64_match:
        b64_str = b64_match.group(0)
        truncated_call = full_call.replace(b64_str, 'data:image/png;base64,...(truncated)...')
        print(truncated_call)
    else:
        print("Couldn't find the base64 string inside the call.")
        print(full_call[:150] + "... " + full_call[-150:])
else:
    print('Not found.')
