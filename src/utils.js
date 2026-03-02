import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from './constants.js';

export let highScore = parseInt(localStorage.getItem("guardian_automata_highscore") || "0");

export function updateHighScore(wave) {
    if (wave > highScore) {
        highScore = wave;
        localStorage.setItem("guardian_automata_highscore", highScore.toString());
    }
}

export function getGridCoords(p) {
    return { x: Math.floor(p.x / TILE_SIZE), y: Math.floor(p.y / TILE_SIZE) };
}

export function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function updateGridRect(grid, gx, gy, gw, gh, val) {
    const cols = grid.length;
    const rows = grid[0].length;
    for (let i = gx; i < gx + gw; i++) {
        for (let j = gy; j < gy + gh; j++) {
            if (i >= 0 && i < cols && j >= 0 && j < rows) grid[i][j] = val;
        }
    }
}

export function findPath(grid, startPos, endPos) {
    if (!grid || !grid[0]) return [];

    // Sanity check for NaN/Infinity positions
    if (isNaN(startPos.x) || isNaN(startPos.y) || isNaN(endPos.x) || isNaN(endPos.y)) return [];

    const cols = grid.length;
    const rows = grid[0].length;
    let start = getGridCoords(startPos);
    let end = getGridCoords(endPos);

    end.x = Math.max(0, Math.min(cols - 1, end.x));
    end.y = Math.max(0, Math.min(rows - 1, end.y));
    start.x = Math.max(0, Math.min(cols - 1, start.x));
    start.y = Math.max(0, Math.min(rows - 1, start.y));

    // Early exit if start is goal or goal is blocked
    if (start.x === end.x && start.y === end.y) return [];
    if (grid[end.x][end.y] === 1) return [];

    const toKey = (x, y) => (x << 16) | y;
    const startKey = toKey(start.x, start.y);
    const endKey = toKey(end.x, end.y);

    let openSet = [start];
    let openSetKeys = new Set([startKey]);
    let closedSet = new Set();
    let cameFrom = new Map();
    let gScore = new Map();
    let fScore = new Map();

    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(start, end));

    let iterations = 0;
    const maxIterations = 200;

    while (openSet.length > 0) {
        if (++iterations > maxIterations) break;

        let bestIdx = 0;
        let minF = Infinity;
        for (let i = 0; i < openSet.length; i++) {
            const node = openSet[i];
            const f = fScore.get(toKey(node.x, node.y)) ?? Infinity;
            if (f < minF) { minF = f; bestIdx = i; }
        }

        let current = openSet.splice(bestIdx, 1)[0];
        const currentKey = toKey(current.x, current.y);
        openSetKeys.delete(currentKey);
        closedSet.add(currentKey);

        if (currentKey === endKey) {
            let path = [];
            let curr = current;
            let tempKey = currentKey;
            let pathIter = 0;
            while (cameFrom.has(tempKey) && pathIter++ < 100) {
                path.push(vec2(curr.x * TILE_SIZE + TILE_SIZE / 2, curr.y * TILE_SIZE + TILE_SIZE / 2));
                curr = cameFrom.get(tempKey);
                tempKey = toKey(curr.x, curr.y);
            }
            return path.reverse();
        }

        const neighbors = [
            { x: current.x + 1, y: current.y }, { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 }, { x: current.x, y: current.y - 1 }
        ];

        for (let n of neighbors) {
            if (n.x < 0 || n.x >= cols || n.y < 0 || n.y >= rows) continue;
            if (grid[n.x][n.y] === 1) continue;

            const nKey = toKey(n.x, n.y);
            if (closedSet.has(nKey)) continue;

            let tentative_gScore = gScore.get(currentKey) + 1;

            if (!gScore.has(nKey) || tentative_gScore < gScore.get(nKey)) {
                cameFrom.set(nKey, current);
                gScore.set(nKey, tentative_gScore);
                fScore.set(nKey, tentative_gScore + heuristic(n, end));
                if (!openSetKeys.has(nKey)) {
                    openSet.push(n);
                    openSetKeys.add(nKey);
                }
            }
        }
    }
    return [];
}

export function createExplosion(p, level = 1) {
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;

    // Core explosion visual
    const explScale = level >= 50 ? 1.0 : (level >= 30 ? 0.75 : 0.5);
    const explColor = level >= 50 ? rgb(0, 200, 255) : (level >= 30 ? rgb(255, 150, 0) : rgb(255, 100, 0));

    const expl = add([
        circle(35),
        color(explColor),
        pos(p.x, p.y),
        scale(explScale),
        anchor("center"),
        opacity(0.8),
        z(150),
    ]);

    const flash = add([
        circle(20),
        color(255, 255, 200),
        pos(p.x, p.y),
        scale(explScale * 0.4),
        anchor("center"),
        opacity(1),
        z(151),
    ]);

    // Enhanced effects for high levels
    if (level >= 30) {
        // Shockwave ring
        const ring = add([
            circle(10),
            pos(p.x, p.y),
            scale(1), // Added missing component
            color(explColor),
            opacity(0.4),
            outline(2, rgb(255, 255, 255)),
            anchor("center"),
            z(149)
        ]);
        ring.onUpdate(() => {
            ring.scale = ring.scale.add(vec2(dt() * 8));
            ring.opacity -= dt() * 2;
            if (ring.opacity <= 0) destroy(ring);
        });

        // Debris particles
        for (let i = 0; i < (level >= 50 ? 12 : 6); i++) {
            const angle = rand(0, 360);
            const speed = rand(200, 400);
            const pSize = rand(4, 8);
            const part = add([
                rect(pSize, pSize),
                pos(p.x, p.y),
                scale(1), // Added missing component
                color(255, 200, 0),
                opacity(1), // Added missing component
                anchor("center"),
                rotate(rand(0, 360)),
                z(152),
                { dir: vec2(Math.cos(angle * Math.PI / 180), Math.sin(angle * Math.PI / 180)) }
            ]);
            part.onUpdate(() => {
                part.move(part.dir.scale(speed * part.opacity));
                part.opacity -= dt() * 2;
                part.angle += dt() * 500;
                if (part.opacity <= 0) destroy(part);
            });
        }
    }

    // Level 50 Super Flash
    if (level >= 50) {
        shake(15);
        const superFlash = add([
            rect(width(), height()),
            pos(0, 0),
            color(255, 255, 255),
            opacity(0.2),
            fixed(),
            z(1000)
        ]);
        superFlash.onUpdate(() => {
            superFlash.opacity -= dt() * 4;
            if (superFlash.opacity <= 0) destroy(superFlash);
        });
    }

    expl.onUpdate(() => {
        expl.opacity -= dt() * 3;
        expl.scale = expl.scale.add(vec2(dt() * (level >= 50 ? 6 : (level >= 30 ? 5 : 4))));
        flash.opacity -= dt() * 5;
        flash.scale = flash.scale.add(vec2(dt() * (level >= 50 ? 8 : (level >= 30 ? 7 : 6))));
        if (expl.opacity <= 0) {
            destroy(expl);
            destroy(flash);
        }
    });
}

export function createHealEffect(p) {
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    const ring = add([
        circle(10),
        color(100, 255, 100),
        pos(p.x, p.y),
        scale(1),
        anchor("center"),
        opacity(0.8),
        outline(2, rgb(255, 255, 255)),
        z(150),
    ]);

    ring.onUpdate(() => {
        ring.opacity -= dt() * 1.5;
        ring.scale = ring.scale.add(vec2(dt() * 2));
        ring.pos.y -= dt() * 20; // Float up
        if (ring.opacity <= 0) {
            destroy(ring);
        }
    });
}
