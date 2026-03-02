import re

html_path = 'c:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix multi-line base64 injections
# The problem is that the injected base64 strings contain newlines which breaks Javascript string literals.
# We will find the INJECTED OBSTACLES block and strip all newlines inside the base64 strings.

def remove_newlines(match):
    return match.group(0).replace('\n', '')

# Find loadSprite lines inside the injected block and clean them up
# A more robust way: just find any base64 string in a loadSprite call and remove newlines
text = re.sub(r'loadSprite\([^"]*,\s*"(data:image/png;base64,.*?)"\);', remove_newlines, text, flags=re.DOTALL)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Fixed syntax errors! You should be able to run the game now.")
