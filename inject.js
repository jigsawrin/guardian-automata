const fs = require('fs');

const map1Path = 'C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\map1_b64.txt';
const map2Path = 'C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\map2_b64.txt';
const playerPath = 'C:\\Users\\nuies\\.gemini\\antigravity\\brain\\35f37d89-f0cd-46a0-a03e-a6f294b6bfbe\\player_sprite_1771782052689.png';
const girlPath = 'C:\\Users\\nuies\\.gemini\\antigravity\\brain\\35f37d89-f0cd-46a0-a03e-a6f294b6bfbe\\girl_sprite_1771782066797.png';
const indexPath = 'C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html';

const map1 = fs.readFileSync(map1Path, 'utf8').trim();
const map2 = fs.readFileSync(map2Path, 'utf8').trim();
const player = fs.readFileSync(playerPath, 'base64');
const girl = fs.readFileSync(girlPath, 'base64');

// Create code to inject
const injection = `// Load Sprites (Base64 for CORS stability)
        const map1_b64 = "data:image/jpeg;base64," + "${map1}";
        const map2_b64 = "data:image/jpeg;base64," + "${map2}";
        const player_b64 = "data:image/png;base64," + "${player}";
        const girl_b64 = "data:image/png;base64," + "${girl}";

        loadSprite("map1", map1_b64);
        loadSprite("map2", map2_b64);
        loadSprite("player", player_b64);
        loadSprite("girl", girl_b64);
`;

let html = fs.readFileSync(indexPath, 'utf8');
if (html.includes('// Sprite loading removed for testing')) {
    html = html.replace('// Sprite loading removed for testing', injection);
    fs.writeFileSync(indexPath, html);
    console.log("Injection successful");
} else {
    console.log("Marker not found in index.html");
}
