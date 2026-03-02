import base64
b64_file = open('assets/girl_sheet_b64.txt').read()[:100]
html_file = open('index.html', encoding='utf-8').read()
html_idx = html_file.find('const girl_b64 = "data:image/png;base64,') + len('const girl_b64 = "data:image/png;base64,')
print("B64 FILE:", b64_file)
print("HTML:", html_file[html_idx:html_idx+100])
print('MATCH!' if b64_file == html_file[html_idx:html_idx+100] else 'MISMATCH!')

with open("test_girl.html", "w") as f:
    f.write(f'<html><body><img src="data:image/png;base64,{open("assets/girl_sheet_b64.txt").read()}" /></body></html>')
