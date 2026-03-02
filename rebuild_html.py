import re

def fix():
    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()

    with open("assets/girl_sheet_b64.txt", "r") as f:
        girl_b64_content = f.read().strip()
        
    # We need to find where the constants are defined.
    # We know map2_b64 and player_b64 are there. 
    # obs_ruins is loaded inline: loadSprite("obs_ruins", "data:...")
    
    # 1. Strip the orphaned yawn dictionary out if it exists randomly
    # 1.a Actually, let's just find the start of `<body>` and `</body>`
    body_start = html.find("<body>")
    body_end = html.find("</body>")
    
    if body_start == -1 or body_end == -1:
        print("Cannot find body tags")
        return
        
    js_section = html[body_start:body_end]
    
    # Let's cleanly rebuild the loadSprite portion.
    # Find `loadSprite("map2"`
    idx_map2 = js_start = html.find('loadSprite("map2"')
    # Find `loadSprite("obs_ruins"`
    idx_obs = html.find('loadSprite("obs_ruins"', idx_map2)
    
    if idx_map2 == -1 or idx_obs == -1:
        print("Cannot find loadSprite map2 or obs_ruins")
        return
        
    # Replace everything between map2 and obs_ruins with the correct config
    
    correct_loads = f"""loadSprite("map2", map2_b64);
        loadSprite("player", player_b64);
        loadSprite("girl", "{girl_b64_content}", {{
            sliceX: 8,
            anims: {{
                idle: {{ from: 0, to: 0, speed: 1, loop: false }},
                yawn: {{ from: 0, to: 3, speed: 2, loop: false }},
                swing: {{ from: 4, to: 7, speed: 4, loop: false }}
            }}
        }});
        """
        
    html = html[:idx_map2] + correct_loads + html[idx_obs:]
    
    # Now, there's a chance the orphaned yawn anim is still at the bottom due to the previous errant replace.
    # Let's find it.
    orphaned_idx = html.find("yawn: { from: 0, to: 3")
    if orphaned_idx > idx_obs + 1000: # Ensure it's not the one we just injected!
        print("Found orphaned yawn at", orphaned_idx)
        # It's probably a junk string like:
        # , {
        #    sliceX: 8,
        #    anims: {
        #        idle: { from: 0, to: 0, speed: 1, loop: false },
        #        yawn: { from: 0, to: 3, speed: 2, loop: false },
        #        swing: { from: 4, to: 7, speed: 4, loop: false }
        #    },
        #});
        
        # We can just use a regex to remove this specific chunk if it exists PAST the newly injected one.
        # Wait, if we just write the clean file, it should be fine as long as there's no syntax error.
        # The errant chunk was literally just that string, replacing the target.
        # Wait, if the errant string replaced TargetContent, then where is the orphaned text?
        # Oh, the multi_replace tool MIGHT have just appended it? No it wouldn't.
        pass

    # Actually, we need to make sure the errant orphan chunk doesn't break JS syntax!
    # Let's print out what is around the orphaned yawn!
    for m in re.finditer(r'yawn: { from: 0, to: 3', html):
        print("Found yawn at", m.start())
        print(html[m.start()-50:m.start()+50])

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html)
        print("Successfully rebuilt index.html sprites!")

fix()
