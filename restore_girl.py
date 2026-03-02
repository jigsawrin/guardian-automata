import base64
import re

with open('assets/girl.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

pattern1 = r'(const\s+girl_b64\s*=\s*"data:image/png;base64,).*?(;)'
html = re.sub(pattern1, rf'\g<1>" + "{b64}"\g<2>', html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Done")
