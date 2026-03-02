const fs = require('fs');

let html = fs.readFileSync('C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html', 'utf8');

// 1. OBSTACLES: Change tag from "building" to "obstacle" and remove hp.
html = html.replace(/"building",\s*\{\s*hp:\s*500\s*\}/g, '"obstacle"');

// 2. RESOURCE DROPS AND COLLECTION
// Remove spawnResource loop
html = html.replace(/function spawnResource\(\) \{[\s\S]*?loop\(4, \(\) => spawnResource\(\)\);/, `function dropResource(p) {
                const r = rand();
                if (r < 0.45) {
                    add([ rect(10, 10), color(200, 200, 200), pos(p), area(), anchor("center"), "resource", { type: "scrap" } ]);
                } else if (r < 0.7) {
                    add([ circle(6), color(255, 255, 0), pos(p), area(), anchor("center"), "resource", { type: "battery" } ]);
                }
            }`);

// Change resource collection to direct inventory addition
html = html.replace(/player\.onCollide\("resource", \(r\) => \{[\s\S]*?carrierText\.text = player\.carryScrap \+ "\/" \+ player\.carryBattery;\s*sounds\.collect\(\);\s*\}\s*\}\);/, `player.onCollide("resource", (r) => {
                destroy(r);
                if (r.type === "scrap") player.scrapCount++;
                else player.batteryCount++;
                sounds.collect();
            });`);

// Remove deposit base collision logic (keep the base visuals though)
html = html.replace(/player\.onCollide\("base", \(\) => \{[\s\S]*?sounds\.collect\(\);\s*\}\s*\}\);/, '');

// Add drop on bullet hit
html = html.replace(/sounds\.explode\(\);\s*\}/, `sounds.explode();
                    dropResource(vec2(e.pos.x, e.pos.y));
                }`);

// Add drop on trap hit (replace specifically the one for trap)
html = html.replace(/sounds\.explode\(\);\s*\}\);\s*function createExplosion/, `sounds.explode();
                dropResource(vec2(e.pos.x, e.pos.y));
            });
            function createExplosion`);

// 3. ENEMY SPAWNING (Fix to be right side ONLY)
html = html.replace(/const side = choose\(\["top", "bottom", "left", "right"\]\);[\s\S]*?if \(side === "right"\) spawnPos = vec2\(width\(\) \+ 50, rand\(0, height\(\)\)\);/, `const spawnPos = vec2(width() + 50, rand(120, height() - 80));`);

// 4. DAY / NIGHT CYCLE AND AVOIDANCE
// Replace Wave logic
const waveLogicRegex = /const waveLabel = add\(\[[\s\S]*?startWave\(\);/m;
const newWaveLogic = `let phase = "day";
            let dayTimer = 0;
            const phaseLabel = add([
                text("DAY", { size: 48, font: "monospace" }),
                pos(width() / 2, height() / 2 - 100),
                anchor("center"),
                opacity(0),
                fixed(),
            ]);

            function startDay() {
                phase = "day";
                dayTimer = 25; // 25s build phase
                phaseLabel.text = "DAY " + currentWave + " - PREPARE";
                phaseLabel.color = rgb(0, 255, 100);
                tween(0, 1, 0.5, (v) => phaseLabel.opacity = v, easings.easeOutQuad);
                
                wait(2, () => {
                   tween(1, 0, 0.5, (v) => phaseLabel.opacity = v, easings.easeInQuad); 
                });
            }

            function startNight() {
                phase = "night";
                enemiesInWave = 5 + currentWave * 4;
                enemiesSpawned = 0;
                
                phaseLabel.text = "NIGHT " + currentWave + " - DEFEND";
                phaseLabel.color = rgb(255, 50, 50);
                tween(0, 1, 0.5, (v) => phaseLabel.opacity = v, easings.easeOutQuad);
                sounds.waveStart();

                wait(2, () => {
                    tween(1, 0, 0.5, (v) => phaseLabel.opacity = v, easings.easeInQuad);
                    spawnLoop();
                });
            }

            function spawnLoop() {
                if (enemiesSpawned < enemiesInWave && phase === "night") {
                    spawnEnemy();
                    wait(rand(1.5, 3.0) / (1 + currentWave * 0.1), spawnLoop);
                }
            }

            onUpdate(() => {
                if (phase === "day") {
                    dayTimer -= dt();
                    if (dayTimer <= 0) {
                        startNight();
                    }
                } else if (phase === "night" && enemiesSpawned >= enemiesInWave && get("enemy").length === 0) {
                    currentWave++;
                    startDay();
                }
            });

            startDay();`;

html = html.replace(waveLogicRegex, newWaveLogic);

// Replace Avoidance AI
html = html.replace(/onUpdate\("enemy", \(e\) => \{\s*const dir = girl\.pos\.sub\(e\.pos\)\.unit\(\);\s*e\.move\(dir\.scale\(e\.speed\)\);\s*\}\);/, `onUpdate("enemy", (e) => {
                let targetPos = vec2(150, height()/2); // Core
                let dir = targetPos.sub(e.pos).unit();
                
                // Obstacle avoidance
                const obstacles = get("obstacle");
                for (const obs of obstacles) {
                    let d = e.pos.dist(obs.pos);
                    // Approximation of bounding box push
                    let size = Math.max(obs.width, obs.height);
                    if (d < size / 2 + 30) {
                        let pushDir = e.pos.sub(obs.pos).unit();
                        dir = dir.add(pushDir.scale(1.5)).unit();
                    }
                }
                
                e.move(dir.scale(e.speed));
            });`);

// Fix UI
html = html.replace(/waveCounterLabel\.text = "WAVE: " \+ currentWave;/, `waveCounterLabel.text = (phase === "day" ? "DAY " : "NIGHT ") + currentWave + (phase === "day" ? " ("+Math.ceil(dayTimer)+"s)" : "");`);
html = html.replace(/scrapLabel\.text = "S: " \+ player\.scrapCount \+ " \/ M:" \+ player\.maxCarry;/, `scrapLabel.text = "S: " + player.scrapCount;`); // Remove Max Carry UI

fs.writeFileSync('C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html', html);
console.log("Logistics & Day/Night patch applied.");
