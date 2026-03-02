import sys
from PIL import Image

def make_transparent(image_path, output_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # If the pixel is white (or very close to white), make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Transparency fixed: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fix_transparency.py <image_path>")
    else:
        path = sys.argv[1]
        make_transparent(path, path)
