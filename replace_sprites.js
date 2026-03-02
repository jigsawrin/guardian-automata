const fs = require('fs');
let html = fs.readFileSync('C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html', 'utf8');

// Replace map background
html = html.replace(/let currentWave = 1;/g, `const currentMap = rand() > 0.5 ? "map1" : "map2";
            add([
                sprite(currentMap, { width: 800, height: 600 }),
                pos(0, 0),
                z(-1)
            ]);
            let currentWave = 1;`);

// Replace girl sprite
html = html.replace(/circle\(20\),\s*color\(255, 100, 200\),/g, 'sprite("girl", { width: 60, height: 60 }),');

// Replace player sprite
html = html.replace(/rect\(30,\s*30\),\s*color\(100,\s*100,\s*255\),/g, 'sprite("player", { width: 50, height: 50 }),');

fs.writeFileSync('C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html', html);
console.log("Replaced successfully!");
