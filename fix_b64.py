import re

with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

with open("assets/girl_sheet_b64.txt", "r") as f:
    b64 = f.read().strip()

new_lines = []
for line in lines:
    if line.strip().startswith("const girl_b64 ="):
        new_lines.append(f'        const girl_b64 = "data:image/png;base64,{b64}";\n')
    else:
        new_lines.append(line)

with open("index.html", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Fixed index.html")
