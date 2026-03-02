import re
import traceback

try:
    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()

    # Find the start of the JS
    js_start = html.find('const map2_b64')
    if js_start == -1:
        print("Could not find js_start")

    # Let's extract the actual base64 file for girl so we have it cleanly.
    with open("assets/girl_sheet_b64.txt", "r") as f:
        girl_b64 = f.read().strip()
    
    # Actually, we shouldn't guess what's corrupted. 
    # Let's just create a completely fresh script block for the game.
    # It seems the sprite loads are a mess. Let's dump the specific region and see it.
    
    idx = html.find("loadSprite(\"girl\"")
    print("loadSprite string:", html[idx:idx+50])
    
    # Find next occurrence of 'loadSprite'
    idx2 = html.find("loadSprite", idx + 15)
    print("Next loadSprite:", html[idx2:idx2+50])
    
    # Find yawns
    idx3 = html.find("yawn:")
    print("yawn context:", html[idx3-50:idx3+50])

except Exception as e:
    traceback.print_exc()
