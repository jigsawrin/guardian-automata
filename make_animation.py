from PIL import Image, ImageDraw, ImageFont
import os

def create_animated_spritesheet():
    if not os.path.exists("assets/girl.png"):
        print("assets/girl.png not found")
        return

    orig = Image.open("assets/girl.png").convert("RGBA")
    w, h = orig.size
    
    # 8 frames: 4 for yawn/sleep, 4 for leg swing
    sheet = Image.new("RGBA", (w * 8, h), (0, 0, 0, 0))
    
    try:
        font = ImageFont.truetype("arial.ttf", 15)
        font_large = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
        font_large = ImageFont.load_default()

    # Create frames
    for i in range(8):
        frame = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame)
        
        if i < 4:
            # Yawn / Sleepy breathe
            # Squish down by i pixels
            squish = [0, 2, 4, 2][i]
            # scale the image slightly
            squished_img = orig.resize((w, h - squish), Image.Resampling.NEAREST)
            frame.paste(squished_img, (0, squish), squished_img)
            
            # draw Zzz
            if i == 1:
                draw.text((w * 0.7, h * 0.2), "z", fill=(255, 255, 255, 255), font=font)
            elif i == 2:
                draw.text((w * 0.6, h * 0.1), "z", fill=(255, 255, 255, 255), font=font)
                draw.text((w * 0.75, h * 0.05), "Z", fill=(255, 255, 255, 255), font=font_large)
            elif i == 3:
                draw.text((w * 0.6, h * 0.1), "z", fill=(255, 255, 255, 255), font=font)
                draw.text((w * 0.75, h * 0.05), "Z", fill=(255, 255, 255, 255), font=font_large)
                draw.text((w * 0.85, -h * 0.05), "Z", fill=(255, 255, 255, 255), font=font_large)
        else:
            # Leg swing
            # copy top 3/4 of image
            top_h = int(h * 0.75)
            top_part = orig.crop((0, 0, w, top_h))
            frame.paste(top_part, (0, 0), top_part)
            
            # get bottom 1/4 (legs)
            bottom_part = orig.crop((0, top_h, w, h))
            
            # swing left and right
            swing = [0, -3, 0, 3][i - 4]
            frame.paste(bottom_part, (swing, top_h), bottom_part)
            
        sheet.paste(frame, (w * i, 0), frame)

    sheet.save("assets/girl_spritesheet.png")
    print("Saved assets/girl_spritesheet.png")
    
    # Also generate base64
    import base64
    with open("assets/girl_spritesheet.png", "rb") as f:
        b64_data = base64.b64encode(f.read()).decode('utf-8')
    with open("assets/girl_sheet_b64.txt", "w") as f:
        f.write(b64_data)
        
    print("Saved b64")

if __name__ == "__main__":
    create_animated_spritesheet()
