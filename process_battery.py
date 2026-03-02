from PIL import Image
import sys
import os

def make_transparent(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    new_data = []
    # Threshold for "white" background
    for item in datas:
        # If the pixel is very close to white, make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    input_file = r"C:\Users\nuies\.gemini\antigravity\brain\ad87fedd-6179-42a3-8ad0-8f521c0d4955\energy_battery_asset_1772150537018.png"
    output_file = r"c:\Users\nuies\.gemini\antigravity\scratch\guardian-automata\assets\battery.png"
    make_transparent(input_file, output_file)
    print(f"Saved transparent image to {output_file}")
