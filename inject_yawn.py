import re
import os

def inject():
    with open("index.html", "r", encoding="utf-8") as f:
        text = f.read()

    with open("assets/girl_sheet_b64.txt", "r") as f:
        b64 = f.read().strip()

    new_b64_line = f'const girl_b64 = "data:image/png;base64,{b64}";'

    # replace const girl_b64 line
    text = re.sub(r'const girl_b64 = [^;]+;', new_b64_line, text)

    # update loadSprite
    old_load = 'loadSprite("girl", girl_b64);'
    new_load = """loadSprite("girl", girl_b64, {
            sliceX: 8,
            anims: {
                idle: { from: 0, to: 0, speed: 1, loop: false },
                yawn: { from: 0, to: 3, speed: 2, loop: false },
                swing: { from: 4, to: 7, speed: 4, loop: false }
            },
        });"""
    text = text.replace(old_load, new_load)

    # injecting animation loop
    # We replaced 'girl.play("idle");' with '// girl.play("idle");'
    old_logic = '// girl.play("idle");'
    new_logic = """girl.play("idle");
            girl.onAnimEnd((anim) => {
                if (anim === "yawn" || anim === "swing") {
                    girl.play("idle");
                }
            });
            loop(10, () => {
                girl.play(choose(["yawn", "swing"]));
            });"""
    text = text.replace(old_logic, new_logic)

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(text)
    print("Injected base64 and logic into index.html")

if __name__ == "__main__":
    inject()
