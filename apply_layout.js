const fs = require('fs');

const mapPath = 'C:\\Users\\nuies\\.gemini\\antigravity\\brain\\35f37d89-f0cd-46a0-a03e-a6f294b6bfbe\\widescreen_wasteland_1771803259740.png';
const indexPath = 'C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html';

const mapB64 = fs.readFileSync(mapPath, 'base64');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Inject new sprite loading logic
const loadSpriteRegex = /loadSprite\("girl", girl_b64\);/g;
html = html.replace(loadSpriteRegex, `loadSprite("girl", girl_b64);
        const wide_map_b64 = "data:image/png;base64," + "${mapB64}";
        loadSprite("wide_map", wide_map_b64);`);

// 2. Change canvas resolution
html = html.replace(/width:\s*800,/, 'width: 1280,');
html = html.replace(/height:\s*600,/, 'height: 720,');

// 3. Update main background rendering
html = html.replace(/const currentMap = rand\(\) > 0\.5 \? "map1" : "map2";/g, 'const currentMap = "wide_map";');
html = html.replace(/sprite\(currentMap, \{ width: 800, height: 600 \}\),/g, 'sprite(currentMap, { width: 1280, height: 720 }),');

// 4. Update Guardian Girl and Player positions
html = html.replace(/pos\(width\(\) \/ 2, height\(\) \/ 2\),\s*\/\/\s*Guardian Girl/g, 'pos(150, height() / 2), // Guardian Girl');
html = html.replace(/pos\(-50, -5\),\s*color\(0, 255, 100\),/g, 'pos(-50, -5), color(0, 255, 100),'); // Keep format consistent
// Replace specifically the girl Hp bar and Sprite
const girlRegex = /const girl = add\(\[[\s\S]*?pos\(width\(\) \/ 2, height\(\) \/ 2\)/;
html = html.replace(girlRegex, `const girl = add([
                sprite("girl", { width: 60, height: 60 }),
                pos(150, height() / 2)`);
const girlHpRegex = /const girlHpBar = add\(\[[\s\S]*?pos\(width\(\) \/ 2, height\(\) \/ 2 - 60\)/;
html = html.replace(girlHpRegex, `const girlHpBar = add([
                rect(100, 10),
                pos(150, height() / 2 - 60)`);

// Replace player pos
const playerRegex = /const player = add\(\[[\s\S]*?pos\(width\(\) \/ 2 - 150, height\(\) \/ 2\)/;
html = html.replace(playerRegex, `const player = add([
                sprite("player", { width: 50, height: 50 }),
                pos(250, height() / 2)`);

// 5. Update obstacle generation
const obstacleGenRegex = /\/\/ Generate Obstacles[\s\S]*?add\(\[/;
html = html.replace(/\/\/ Generate Obstacles\s*for \(let i = 0; i < 12; i\+\+D\) \{[\s\S]*?add\(\[/, `// Generate Obstacles`); // We will simply replace the whole block using replace properly

html = html.replace(`for (let i = 0; i < 12; i++) {
                const ox = rand(100, width() - 100);
                const oy = rand(120, height() - 100);
                // Don't spawn too close to center (Guardian Girl)
                if (Math.abs(ox - width() / 2) < 200 && Math.abs(oy - height() / 2) < 200) continue;`,
    `for (let i = 0; i < 16; i++) {
                const ox = rand(300, width() - 100);
                const oy = rand(120, height() - 100);`);

// 6. Update Enemy Spawning
html = html.replace(`const side = choose(["top", "bottom", "left", "right"]);
                let spawnPos;
                if (side === "top") spawnPos = vec2(rand(0, width()), -50);
                if (side === "bottom") spawnPos = vec2(rand(0, width()), height() + 50);
                if (side === "left") spawnPos = vec2(-50, rand(0, height()));
                if (side === "right") spawnPos = vec2(width() + 50, rand(0, height()));`,
    `const spawnPos = vec2(width() + 50, rand(120, height() - 80));`);

// 7. Add Bottom UI Band
const uiRegex = /z\(100\),\s*\]\);\s*ui\.add\(\[\s*rect\(width\(\), 2\),\s*pos\(0, 78\),\s*color\(0, 255, 100, 0\.5\),\s*\]\);/g;
html = html.replace(uiRegex, `z(100),
            ]);
            ui.add([
                rect(width(), 2),
                pos(0, 78),
                color(0, 255, 100, 0.5),
            ]);

            const bottomUi = add([
                rect(width(), 60),
                pos(0, height() - 60),
                color(10, 10, 30, 0.8),
                fixed(),
                z(100),
            ]);
            bottomUi.add([
                rect(width(), 2),
                pos(0, 0),
                color(0, 100, 255, 0.5),
            ]);
            bottomUi.add([
                text("SYSTEM STATUS: NOMINAL | SECTOR 7 DEFENSE ACTIVE", { size: 16, font: "monospace" }),
                pos(20, 20),
                color(0, 255, 255),
            ]);`);

fs.writeFileSync('C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html', html);
console.log("Widescreen updates applied.");
