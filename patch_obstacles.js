const fs = require('fs');
const path = require('path');

const htmlPath = 'C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// The image paths
const images = {
    obs_ruins: 'C:\\Users\\nuies\\.gemini\\antigravity\\brain\\35f37d89-f0cd-46a0-a03e-a6f294b6bfbe\\obs_ruins_1771833906794.png',
    obs_car: 'C:\\Users\\nuies\\.gemini\\antigravity\\brain\\35f37d89-f0cd-46a0-a03e-a6f294b6bfbe\\obs_car_1771833925203.png',
    obs_playground: 'C:\\Users\\nuies\\.gemini\\antigravity\\brain\\35f37d89-f0cd-46a0-a03e-a6f294b6bfbe\\obs_playground_1771833949000.png',
    obs_ground: 'C:\\Users\\nuies\\.gemini\\antigravity\\brain\\35f37d89-f0cd-46a0-a03e-a6f294b6bfbe\\obs_ground_1771833967916.png'
};

// 1. Inject loadSprite calls
let loadSpriteStr = '\n';
for (const [name, p] of Object.entries(images)) {
    const base64 = fs.readFileSync(p, { encoding: 'base64' });
    loadSpriteStr += `        loadSprite("${name}", "data:image/png;base64,${base64}");\n`;
}

// Find where to inject loadSprites. Right after loadSprite("girl"...)
const loadBgAnchor = `loadSprite("girl",`;
const lines = html.split('\n');
let insertIndex = lines.findIndex(l => l.includes(loadBgAnchor));

if (insertIndex !== -1 && !html.includes('loadSprite("obs_ruins"')) {
    html = lines.slice(0, insertIndex + 1).join('\n') + loadSpriteStr + lines.slice(insertIndex + 1).join('\n');
}

// 2. Modify the obstacle layout generation
const startMarker = `// Generate Obstacles based on layout`;
const endMarker = `// A* Pathfinding Implementation`;

const startIndex = html.indexOf(startMarker);
const endIndex = html.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newGen = `// Generate Obstacles based on layout
            for (let block of currentLayout) {
                updateGridRect(block.x, block.y, block.w, block.h, 1);
                const obsType = choose(["obs_ruins", "obs_car", "obs_playground", "obs_ground"]);
                add([
                    sprite(obsType, { width: block.w * tileSize, height: block.h * tileSize }),
                    pos(block.x * tileSize, block.y * tileSize),
                    area(),
                    body({ isStatic: true }),
                    "obstacle"
                ]);
            }

            `;
    html = html.substring(0, startIndex) + newGen + html.substring(endIndex);
}

fs.writeFileSync(htmlPath, html);
console.log("Obstacle sprites injected and mapped.");
