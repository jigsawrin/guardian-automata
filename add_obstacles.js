const fs = require('fs');
let html = fs.readFileSync('C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html', 'utf8');

const obstacleCode = `let currentWave = 1;

            // Generate Obstacles
            for (let i = 0; i < 12; i++) {
                const ox = rand(100, width() - 100);
                const oy = rand(120, height() - 100);
                // Don't spawn too close to center (Guardian Girl)
                if (Math.abs(ox - width() / 2) < 200 && Math.abs(oy - height() / 2) < 200) continue;
                
                add([
                    rect(rand(50, 130), rand(50, 130)),
                    pos(ox, oy),
                    color(30, 30, 40),
                    opacity(0.85),
                    outline(2, { color: rgb(0,0,0) }),
                    area(),
                    body({ isStatic: true }),
                    "building",
                    { hp: 500 }
                ]);
            }`;

html = html.replace('let currentWave = 1;', obstacleCode);

fs.writeFileSync('C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html', html);
console.log("Obstacles added.");
