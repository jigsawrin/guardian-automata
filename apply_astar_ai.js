const fs = require('fs');

const htmlPath = 'C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Replace the random obstacle generation with structured layouts and Grid tracking
const oldObstacleGen = `            // Generate Obstacles
            for (let i = 0; i < 16; i++) {
                const ox = rand(300, width() - 100);
                const oy = rand(120, height() - 100);

                add([
                    rect(rand(50, 130), rand(50, 130)),
                    pos(ox, oy),
                    color(30, 30, 40),
                    opacity(0.85),
                    outline(2, { color: rgb(0, 0, 0) }),
                    area(),
                    body({ isStatic: true }),
                    "obstacle"
                ]);
            }`;

const newObstacleGen = `            // Grid & Structured Layouts
            const tileSize = 40;
            const cols = Math.floor(1280 / tileSize);
            const rows = Math.floor(720 / tileSize);
            let grid = Array(cols).fill().map(() => Array(rows).fill(0));

            const layouts = [
                // Layout 0: Chokepoints
                [
                    {x: 10, y: 2, w: 2, h: 5}, {x: 10, y: 11, w: 2, h: 5},
                    {x: 20, y: 5, w: 2, h: 8}
                ],
                // Layout 1: Ruined City Blocks
                [
                    {x: 8, y: 3, w: 4, h: 3}, {x: 16, y: 3, w: 4, h: 3}, {x: 24, y: 3, w: 3, h: 3},
                    {x: 8, y: 12, w: 4, h: 3}, {x: 16, y: 12, w: 4, h: 3}, {x: 24, y: 12, w: 3, h: 3}
                ],
                // Layout 2: Maze
                [
                    {x: 12, y: 1, w: 1, h: 10}, {x: 12, y: 14, w: 1, h: 3},
                    {x: 18, y: 3, w: 1, h: 14}, {x: 24, y: 1, w: 1, h: 12}
                ]
            ];
            const currentLayout = choose(layouts);

            function updateGridRect(gx, gy, gw, gh, val) {
                for (let i = gx; i < gx + gw; i++) {
                    for (let j = gy; j < gy + gh; j++) {
                        if (i >= 0 && i < cols && j >= 0 && j < rows) grid[i][j] = val;
                    }
                }
            }

            // Generate Obstacles based on layout
            for (let block of currentLayout) {
                updateGridRect(block.x, block.y, block.w, block.h, 1);
                add([
                    rect(block.w * tileSize, block.h * tileSize),
                    pos(block.x * tileSize, block.y * tileSize),
                    color(40, 45, 50), // slightly structured concrete color
                    opacity(0.9),
                    outline(2, { color: rgb(20, 25, 30) }),
                    area(),
                    body({ isStatic: true }),
                    "obstacle"
                ]);
            }

            // A* Pathfinding Implementation
            function getGridCoords(p) {
                return { x: Math.floor(p.x / tileSize), y: Math.floor(p.y / tileSize) };
            }

            function heuristic(a, b) {
                return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
            }

            function findPath(startPos, endPos) {
                let start = getGridCoords(startPos);
                let end = getGridCoords(endPos);
                
                // Clamp end
                end.x = Math.max(0, Math.min(cols-1, end.x));
                end.y = Math.max(0, Math.min(rows-1, end.y));
                start.x = Math.max(0, Math.min(cols-1, start.x));
                start.y = Math.max(0, Math.min(rows-1, start.y));

                let openSet = [start];
                let cameFrom = {};
                let gScore = {};
                let fScore = {};
                
                const toKey = (n) => \`\${n.x},\${n.y}\`;
                gScore[toKey(start)] = 0;
                fScore[toKey(start)] = heuristic(start, end);

                while (openSet.length > 0) {
                    // Lowest fScore
                    openSet.sort((a, b) => fScore[toKey(a)] - fScore[toKey(b)]);
                    let current = openSet.shift();

                    if (current.x === end.x && current.y === end.y) {
                        let path = [];
                        let curr = current;
                        while(cameFrom[toKey(curr)]) {
                            path.push(vec2(curr.x * tileSize + tileSize/2, curr.y * tileSize + tileSize/2));
                            curr = cameFrom[toKey(curr)];
                        }
                        return path.reverse();
                    }

                    const neighbors = [
                        {x: current.x+1, y: current.y}, {x: current.x-1, y: current.y},
                        {x: current.x, y: current.y+1}, {x: current.x, y: current.y-1}
                    ];

                    for (let n of neighbors) {
                        if (n.x < 0 || n.x >= cols || n.y < 0 || n.y >= rows) continue;
                        if (grid[n.x][n.y] === 1) continue; // Wall

                        let tentative_gScore = gScore[toKey(current)] + 1;
                        let nKey = toKey(n);

                        if (gScore[nKey] === undefined || tentative_gScore < gScore[nKey]) {
                            cameFrom[nKey] = current;
                            gScore[nKey] = tentative_gScore;
                            fScore[nKey] = tentative_gScore + heuristic(n, end);
                            if (!openSet.some(o => o.x === n.x && o.y === n.y)) {
                                openSet.push(n);
                            }
                        }
                    }
                }
                return []; // No path found
            }`;

html = html.replace(oldObstacleGen, newObstacleGen);

// 2. Update Wall Building to register to Grid and trigger path recalculations
const oldWallBuild = `                    } else if (type === "wall") {
                        add([
                            rect(40, 40),
                            pos(buildPos),
                            color(80, 80, 80),
                            area(),
                            body({ isStatic: true }),
                            outline(4),
                            anchor("center"),
                            "obstacle",
                            "wall",
                            { hp: 150 }
                        ]);
                        sounds.build();`;

const newWallBuild = `                    } else if (type === "wall") {
                        const w = add([
                            rect(40, 40),
                            pos(buildPos),
                            color(80, 80, 80),
                            area(),
                            body({ isStatic: true }),
                            outline(4),
                            anchor("center"),
                            "obstacle",
                            "wall",
                            { hp: 150 }
                        ]);
                        let gc = getGridCoords(buildPos);
                        if(gc.x >= 0 && gc.x < cols && gc.y >= 0 && gc.y < rows) {
                            grid[gc.x][gc.y] = 1;
                            w.gridCoords = gc;
                            // Trigger all enemies to recalculate
                            every("enemy", (e) => e.trigger("recalc_path"));
                        }
                        sounds.build();`;
html = html.replace(oldWallBuild, newWallBuild);

// 3. Update Wall Destruction to free grid
const oldWallDestroy = `            onCollide("enemy", "building", (e, b) => {
                destroy(e);
                b.hp -= 30;
                shake(5);
                if (b.hp <= 0) destroy(b);
            });`;

// We also need to remove the "enemy" "building" collision for walls entirely if they are tagged "obstacle".
// Wait, they are tagged "obstacle" "wall", so the building collision might not even fire if they aren't tagged building.
// Let's hook into the onDestroy event for walls instead.
const newWallDestroy = `            onCollide("bullet", "obstacle", (b, o) => {
                destroy(b);
            });
            on("destroy", "wall", (w) => {
                if(w.gridCoords) grid[w.gridCoords.x][w.gridCoords.y] = 0;
                every("enemy", (e) => e.trigger("recalc_path"));
            });`;
html = html.replace(oldWallDestroy, newWallDestroy);

// 4. Enemy AI update to use Paths
const oldEnemyUpdate = `            onUpdate("enemy", (e) => {
                let targetPos = vec2(150, height() / 2); // Core
                let desiredDir = targetPos.sub(e.pos).unit();
                let dir = desiredDir;

                // Local avoidance pooling (Boids Separation) to prevent clump overlap
                const enemies = get("enemy");
                for (const other of enemies) {
                    if (other !== e) {
                        let d = e.pos.dist(other.pos);
                        if (d < 35) { // push apart slightly if too close
                            let separateDir = e.pos.sub(other.pos).unit();
                            dir = dir.add(separateDir.scale(0.8));
                        }
                    }
                }

                // Obstacle steering vector (soft avoidance to assist physics)
                const obstacles = get("obstacle");
                for (const obs of obstacles) {
                    let d = e.pos.dist(obs.pos);
                    let size = Math.max(obs.width || 40, obs.height || 40);
                    let avoidanceRadius = size / 2 + 50; 
                    if (d < avoidanceRadius) {
                        // Slide perfectly up or down relative to the obstacle
                        let slideDir = e.pos.y > obs.pos.y ? vec2(0, 1) : vec2(0, -1);
                        dir = dir.add(slideDir.scale(1.5));
                    }
                }
                
                // apply speed
                e.move(dir.unit().scale(e.speed));
            });`;

const newEnemyAI = `            // Event listener for path recalculation
            on("recalc_path", "enemy", (e) => {
                e.path = findPath(e.pos, vec2(150, height() / 2));
            });

            onAdd("enemy", (e) => {
                e.trigger("recalc_path");
            });

            onUpdate("enemy", (e) => {
                let targetPos = vec2(150, height() / 2); // default fallback
                let dir = vec2(0, 0);

                if (e.path && e.path.length > 0) {
                    let nextNode = e.path[0];
                    if (e.pos.dist(nextNode) < 10) {
                        e.path.shift();
                    } else {
                        targetPos = nextNode;
                    }
                } else {
                    // If no path (blocked), just try to move left slowly or re-calc
                    if (rand() < 0.05) e.trigger("recalc_path"); 
                }

                dir = targetPos.sub(e.pos).unit();

                // Separation (Boids) to stop stacking
                const enemies = get("enemy");
                for (const other of enemies) {
                    if (other !== e) {
                        let d = e.pos.dist(other.pos);
                        if (d < 35) {
                            dir = dir.add(e.pos.sub(other.pos).unit().scale(0.5));
                        }
                    }
                }
                
                e.move(dir.unit().scale(e.speed));
            });`;

html = html.replace(oldEnemyUpdate, newEnemyAI);

fs.writeFileSync(htmlPath, html);
console.log("A* and Grids applied.");
