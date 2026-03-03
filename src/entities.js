import { sounds } from './audio.js';
import { createExplosion, findPath, createHealEffect } from './utils.js';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from './constants.js';

export function dropResource(p, level = 1) {
    console.assert(p && typeof p.x === 'number' && typeof p.y === 'number', "dropResource: p must be a vector (vec2)");
    const r = rand();
    const type = r < 0.10 ? "battery" : "scrap";

    // Use Number.isFinite for robust position validation
    const isValidPos = p && Number.isFinite(p.x) && Number.isFinite(p.y);
    let dropPos = isValidPos ? p : vec2(rand(100, 1180), rand(140, 580));

    // Ensure it's inside the map boundaries
    dropPos.x = Math.max(80, Math.min(1200, dropPos.x));
    dropPos.y = Math.max(140, Math.min(580, dropPos.y));

    const res = add([
        sprite(type, { width: 30, height: 30 }),
        pos(dropPos),
        area(),
        anchor("center"),
        z(20),
        lifespan(30, { fade: 2 }),
        "resource",
        { type: type }
    ]);

    const haloColor = type === "scrap" ? rgb(255, 100, 200) : rgb(0, 255, 100);
    const halo = res.add([
        circle(10),
        color(haloColor),
        anchor("center"),
        z(-1),
        opacity(0.2),
    ]);

    halo.onUpdate(() => {
        if (!res.exists()) return;
        halo.opacity = wave(0.05, 0.25, time() * 3);
        halo.radius = wave(10, 14, time() * 3);
    });

    // Restore pop-out logic from the shadowed function but keep it safe
    const angle = rand(0, 360);
    const force = rand(50, 150);
    const rad = angle * Math.PI / 180;
    const moveDirX = Math.cos(rad);
    const moveDirY = Math.sin(rad);
    let popTimer = 0.3;

    res.onUpdate(() => {
        if (popTimer > 0) {
            const currentForce = force * (popTimer / 0.3);
            res.move(moveDirX * currentForce, moveDirY * currentForce);
            popTimer -= dt();

            // Clamping during pop-out to keep it inside
            res.pos.x = Math.max(80, Math.min(1200, res.pos.x));
            res.pos.y = Math.max(140, Math.min(580, res.pos.y));
        }
    });
}

export function spawnMortar(start, target, girl, girlHpFill, gameOverCallback) {
    console.assert(start && typeof start.x === 'number', "spawnMortar: start must be a vector");
    console.assert(target && typeof target.x === 'number', "spawnMortar: target must be a vector");
    console.assert(girl && typeof girl.hp === 'number', "spawnMortar: girl must be an object with hp");
    console.assert(typeof gameOverCallback === 'function', "spawnMortar: gameOverCallback must be a function");
    const duration = 2.5;
    let elapsed = 0;
    const m = add([
        circle(12),
        color(255, 200, 0),
        outline(2, rgb(255, 100, 0)),
        pos(start),
        anchor("center"),
        z(116),
        "enemyMortar",
        {
            startPos: start,
            targetPos: target,
        }
    ]);

    m.add([
        circle(8),
        color(255, 255, 255),
        anchor("center"),
    ]);

    sounds.pyuin();

    m.onUpdate(() => {
        elapsed += dt();
        const t = Math.min(1, elapsed / duration);
        const currentPos = start.lerp(target, t);
        const height = 150;
        const arcOffset = Math.sin(t * Math.PI) * height;

        const nextX = currentPos.x;
        const nextY = currentPos.y - arcOffset;
        if (Number.isFinite(nextX) && Number.isFinite(nextY)) {
            m.pos = vec2(nextX, nextY);
        }

        if (t >= 1) {
            createExplosion(target);
            sounds.explode();
            shake(10);
            girl.hp -= 20;
            girlHpFill.width = Math.max(0, (girl.hp / girl.maxHp) * 100);
            if (girl.hp <= 0) gameOverCallback();
            destroy(m);
        }
    });
}

export function spawnEnemy(gameState, enemiesSpawned) {
    const currentWave = gameState.currentWave;
    console.assert(typeof currentWave === 'number', "spawnEnemy: currentWave must be a number");
    console.assert(typeof enemiesSpawned === 'number', "spawnEnemy: enemiesSpawned must be a number");
    const spawnPos = vec2(MAP_WIDTH + 100, rand(128, MAP_HEIGHT - 128));
    let type = "normal";

    if (currentWave === 8) {
        const e = add([
            sprite("enemy", { width: 500, height: 500 }),
            color(255, 80, 80),
            pos(MAP_WIDTH + 400, MAP_HEIGHT / 2),
            area(),
            anchor("center"),
            "enemy",
            "boss",
            z(80),
            {
                speed: 15,
                hp: 25,
                maxHp: 25,
                targetOffset: 0,
                stepTimer: 0,
                shieldHP: 0,
                maxShieldHP: 0
            }
        ]);
        e.add([
            rect(300, 15),
            pos(0, -280),
            color(30, 30, 30),
            outline(3),
            anchor("center"),
            z(110),
        ]);
        e.add([
            rect(300, 15),
            pos(-150, -280),
            color(255, 50, 50),
            anchor("left"),
            z(110),
            "hpbar"
        ]);
        return e;
    }

    // (Probability logic remains mostly same, but we need to ensure type is selected first)
    // ... (logic moved below to select type first)

    let heavyProb = 0;
    if (currentWave >= 2) heavyProb = Math.min(0.3, 0.1 + (currentWave - 2) * 0.05);
    let rangedProb = 0;
    if (currentWave >= 5) rangedProb = Math.min(0.3, 0.1 + (currentWave - 5) * 0.05);
    let warpProb = 0;
    if (currentWave >= 6) warpProb = Math.min(0.25, 0.08 + (currentWave - 6) * 0.04);

    let assassinProb = 0;
    if (currentWave >= 10) assassinProb = Math.min(0.25, 0.10 + (currentWave - 10) * 0.03);

    const r = rand();
    if (r < rangedProb) type = "ranged";
    else if (r < rangedProb + warpProb) type = "warp";
    else if (r < rangedProb + warpProb + assassinProb) type = "assassin";
    else if (r < rangedProb + warpProb + assassinProb + (currentWave >= 7 ? 0.1 : 0)) type = "jammer";
    else if (r < rangedProb + warpProb + assassinProb + (currentWave >= 7 ? 0.1 : 0) + heavyProb) type = "heavy";
    else type = "normal";

    // Shielded enemies: Randomly from Wave 6 onwards, fixed 10% chance
    let shieldProb = 0;
    if (currentWave >= 6) {
        shieldProb = 0.1;
    }

    // Check for "First Spawn" forced shield OR random chance
    let isShielded = (rand() < shieldProb) && currentWave !== 8;

    if (!gameState.spawnedEnemyTypes) gameState.spawnedEnemyTypes = [];
    if (!gameState.spawnedEnemyTypes.includes(type)) {
        if (type !== "normal") isShielded = true;
        gameState.spawnedEnemyTypes.push(type);
    }

    let shieldHP = 0;
    if (isShielded) {
        // Scaling HP based on wave
        shieldHP = currentWave < 5 ? 3 : (2 + Math.floor((currentWave - 5) / 2));
    }
    // Speed: base + wave * scaling (Aggressive)
    // HP: base + floor(wave / 3)
    const hpBoost = Math.floor(currentWave / 3);
    const specs = {
        heavy: { w: 120, h: 120, col: rgb(150, 150, 255), speed: 30 + currentWave * 4, hp: 3 + hpBoost, areaScale: 0.2, barW: 40, barY: -60, sprite: "enemy" },
        ranged: { w: 70, h: 70, col: rgb(0, 255, 255), speed: 50 + currentWave * 3, hp: 2 + hpBoost, areaScale: 0.2, barW: 20, barY: -40, sprite: "enemy" },
        warp: { w: 80, h: 80, col: rgb(255, 255, 255), speed: 20 + currentWave * 2, hp: 1 + hpBoost, areaScale: 0.2, barW: 25, barY: -50, sprite: "enemy_warp" },
        assassin: { w: 80, h: 80, col: rgb(255, 100, 100), speed: 40 + currentWave * 3, hp: 1 + hpBoost, areaScale: 0.2, barW: 25, barY: -50, sprite: "enemy_assassin" },
        jammer: { w: 100, h: 100, col: rgb(255, 255, 200), speed: 30 + currentWave * 2, hp: 2 + hpBoost, areaScale: 0.2, barW: 35, barY: -55, sprite: "enemy_jammer" },
        normal: { w: 90, h: 90, col: rgb(255, 180, 180), speed: 45 + currentWave * 5, hp: 1 + hpBoost, areaScale: 0.2, barW: 30, barY: -45, sprite: "enemy" }
    };

    const s = specs[type];
    const e = add([
        sprite(s.sprite, { width: s.w, height: s.h }),
        color(s.col),
        pos(spawnPos),
        area({ scale: s.areaScale }),
        body(),
        anchor("center"),
        "enemy",
        type !== "normal" ? type : "",
        z(80),
        {
            speed: s.speed,
            hp: s.hp,
            maxHp: s.hp,
            shieldHP: shieldHP, // New shield HP
            maxShieldHP: shieldHP,
            targetOffset: type === "ranged" ? rand(-50, 50) : rand(-100, 100),
            ...(type === "ranged" ? { reloadTimer: 1.5, stopDistance: rand(750, 950) } : {}),
            ...(type === "warp" ? { warpTimer: rand(2, 4) } : {}),
            ...(type === "assassin" ? { warpTimer: rand(3, 5) } : {}),
            ...(type === "jammer" ? { jamTimer: rand(3, 5) } : {}),
            barW: s.barW
        }
    ]);

    if (type === "warp") {
        e.onUpdate(() => {
            if (gameState.paused) return;
            e.warpTimer -= dt();
            if (e.warpTimer <= 0) {
                e.warpTimer = rand(3, 5);
                const target = get("girl")[0];
                if (target) {
                    const diff = target.pos.sub(e.pos);
                    if (diff.len() > 0.1) {
                        const dir = diff.unit();
                        const warpDist = 180;
                        const moveVec = dir.scale(warpDist);
                        if (Number.isFinite(moveVec.x) && Number.isFinite(moveVec.y)) {
                            e.pos = e.pos.add(moveVec);
                        }
                    }

                    // Visual effect after warp
                    const flash2 = add([
                        rect(e.width, e.height),
                        pos(e.pos),
                        color(150, 0, 255),
                        opacity(1),
                        anchor("center"),
                        z(81)
                    ]);
                    flash2.onUpdate(() => { flash2.opacity -= dt() * 5; if (flash2.opacity <= 0) destroy(flash2); });

                    if (sounds && sounds.spawn) sounds.spawn();
                }
            }
        });
    }

    if (type === "assassin") {
        e.onUpdate(() => {
            if (gameState.paused) return;
            e.warpTimer -= dt();
            if (e.warpTimer <= 0) {
                e.warpTimer = rand(4, 7);
                const targets = get("turret");
                if (targets.length > 0) {
                    let closest = targets[0];
                    let minDist = e.pos.dist(targets[0].pos);
                    for (const t of targets) {
                        const d = e.pos.dist(t.pos);
                        if (d < minDist) {
                            minDist = d;
                            closest = t;
                        }
                    }
                    const target = closest;
                    const diff = target.pos.sub(e.pos);
                    if (diff.len() > 0.1) {
                        const dir = diff.unit();
                        const warpDist = Math.max(0, e.pos.dist(target.pos) - 60);
                        const moveVec = dir.scale(warpDist);
                        if (Number.isFinite(moveVec.x) && Number.isFinite(moveVec.y)) {
                            e.pos = e.pos.add(moveVec);
                        }
                    }

                    const flash2 = add([
                        rect(e.width, e.height),
                        pos(e.pos),
                        color(255, 0, 0),
                        opacity(1),
                        anchor("center"),
                        z(81)
                    ]);
                    flash2.onUpdate(() => { flash2.opacity -= dt() * 5; if (flash2.opacity <= 0) destroy(flash2); });

                    if (sounds && sounds.spawn) sounds.spawn();
                }
            }
        });
    }

    if (type === "jammer") {
        e.onUpdate(() => {
            if (gameState.paused) return;
            e.jamTimer -= dt();
            if (e.jamTimer <= 0) {
                // Trigger Jamming
                gameState.jammingTimer = 4.0;
                sounds.warningIn();

                // Massive visual wave effect
                const waveEffect = add([
                    circle(10),
                    pos(e.pos),
                    color(255, 255, 0),
                    opacity(1),
                    outline(4, rgb(255, 255, 255)),
                    anchor("center"),
                    z(200),
                ]);
                waveEffect.onUpdate(() => {
                    waveEffect.radius += dt() * 3000;
                    waveEffect.opacity -= dt() * 1.5;
                    if (waveEffect.opacity <= 0) destroy(waveEffect);
                });

                createExplosion(e.pos, gameState.level);
                sounds.explode(gameState.level);
                destroy(e);
            }
        });
    }

    if (isShielded) {
        // Visual Barrier
        const shieldVisual = e.add([
            circle(s.w * 0.6), // Slightly larger than enemy
            color(0, 150, 255),
            opacity(0.3),
            outline(2, rgb(255, 255, 255)),
            anchor("center"),
            z(-1), // Behind enemy model but inside the object
            "shield_visual"
        ]);

        // Shield HP Label
        e.add([
            text(shieldHP, { size: 16 }),
            pos(0, 0),
            anchor("center"),
            color(255, 255, 255),
            z(5),
            "shield_label"
        ]);

        shieldVisual.onUpdate(() => {
            // Pulse effect
            shieldVisual.opacity = wave(0.2, 0.4, time() * 4);
            shieldVisual.radius = s.w * 0.6 + wave(-2, 2, time() * 8);
        });
    }

    e.add([
        rect(s.barW, type === "ranged" ? 3 : (type === "heavy" ? 6 : 4)),
        pos(0, s.barY),
        color(50, 50, 50),
        outline(1),
        anchor("center"),
        z(110),
    ]);
    e.add([
        rect(s.barW, type === "ranged" ? 3 : (type === "heavy" ? 6 : 4)),
        pos(-s.barW / 2, s.barY),
        color(255, 50, 50),
        anchor("left"),
        z(110),
        "hpbar"
    ]);

    return e;
}

export function build(type, player, upgrades, level = 1, spriteName = "turret") {
    console.assert(typeof type === 'string', "build: type must be a string");
    console.assert(player && typeof player.pos === 'object', "build: player must be an object with pos");
    console.assert(upgrades && typeof upgrades.turretFireRateMod === 'number', "build: upgrades must be an object with mods");
    const buildPos = player.pos;
    const existingStructures = get("obstacle").concat(get("building"));
    for (let s of existingStructures) {
        if (s.pos.dist(buildPos) < 20) return;
    }
    if (buildPos.x < 20 || buildPos.x > MAP_WIDTH - 20 || buildPos.y < 20 || buildPos.y > MAP_HEIGHT - 20) return;

    const core = get("girl")[0];
    if (core && buildPos.dist(core.pos) < 60) {
        // Too close to core, would block or overlap too much
        return;
    }

    // Simplified building (no longer requires resources)
    if (type === "turret") {
        const hp = 3;
        const fireRate = 1.2;
        const range = 350;
        const dmg = 1;
        const tcol = rgb(180, 180, 255);
        const bcol = rgb(255, 255, 0);

        const t = add([
            sprite(spriteName, { width: 80, height: 80 }),
            pos(buildPos),
            color(tcol),
            area(),
            anchor("center"),
            "building",
            "turret",
            z(50),
            {
                hp: hp * (upgrades.turretHpMod || 1),
                maxHp: hp * (upgrades.turretHpMod || 1),
                fireRate: fireRate,
                timer: 0,
                firstShot: true, // v3.2.5 feature
                range: range,
                dmg: dmg,
                bcol: bcol
            }
        ]);
        t.add([
            rect(40, 4),
            pos(0, 35),
            color(50, 50, 50),
            outline(2),
            anchor("center"),
            z(110)
        ]);
        t.add([
            rect(40, 4),
            pos(-20, 35),
            color(0, 255, 100),
            anchor("left"),
            z(110),
            "hpbar"
        ]);
        sounds.build();
        return true;
    }
    return false;
}

export function spawnDrone(gameState, sounds) {
    const dLimit = gameState.upgrades.drone || 0;
    if (dLimit <= 0 || get("drone").length >= dLimit) return;

    const girl = get("girl")[0];
    if (!girl) return;

    const droneLvl = gameState.upgrades.droneLvl || 0;
    const hp = 1 + droneLvl;
    const fireInterval = Math.max(2.0, 5.0 - droneLvl);

    const startPos = girl.pos.add(vec2(120, rand(-60, 60))); // Randomize start Y slightly for multiple drones
    const drone = add([
        sprite("drone", { width: 40, height: 40 }),
        pos(startPos),
        anchor("center"),
        area(),
        z(100),
        "drone",
        {
            hp: hp,
            maxHp: hp,
            fireTimer: fireInterval,
            targetPos: startPos,
            moveTimer: 0,
            fireInterval: fireInterval
        }
    ]);

    // Simple HP bar for drone
    const droneHpBar = drone.add([
        rect(30, 4),
        pos(0, -25),
        color(0, 255, 100),
        anchor("center"),
        z(1),
        "hpbar"
    ]);

    drone.onUpdate(() => {
        if (gameState.paused) return;

        // Update HP Bar
        droneHpBar.width = (drone.hp / drone.maxHp) * 30;

        // Move Logic: Wander within a range
        drone.moveTimer -= dt();
        if (drone.moveTimer <= 0) {
            drone.moveTimer = rand(1, 3);
            drone.targetPos = vec2(
                rand(girl.pos.x + 50, girl.pos.x + 400),
                rand(MAP_HEIGHT * 0.2, MAP_HEIGHT * 0.8)
            );
        }

        const moveDir = drone.targetPos.sub(drone.pos);
        if (moveDir.len() > 10) {
            drone.move(moveDir.unit().scale(120));
        }

        // Bobbing effect
        drone.pos.y += Math.sin(time() * 5) * 0.5;

        // Shooting Logic
        drone.fireTimer -= dt();
        if (drone.fireTimer <= 0 && gameState.jammingTimer <= 0) {
            const targets = get("enemy");
            if (targets.length > 0) {
                let closest = null;
                let minDist = 400;
                // Optimization: Limit target scan
                const scanCount = Math.min(targets.length, 20);
                for (let i = 0; i < scanCount; i++) {
                    const e = targets[i];
                    if (!e.exists()) continue;
                    const d = drone.pos.dist(e.pos);
                    if (d < minDist) {
                        minDist = d;
                        closest = e;
                    }
                }

                if (closest) {
                    // Fire bullet
                    const diff = closest.pos.sub(drone.pos);
                    const dir = diff.len() > 0.1 ? diff.unit() : vec2(-1, 0);
                    add([
                        rect(8, 4),
                        pos(drone.pos),
                        color(0, 255, 255),
                        rotate(dir.angle()),
                        anchor("center"),
                        area({ scale: vec2(2, 2) }),
                        move(dir, 1000),
                        offscreen({ destroy: true }),
                        "bullet",
                        z(95),
                        { dmg: 1, pierce: 0, ricochet: 0, homing: 0, source: "drone" }
                    ]);

                    sounds.shoot();
                    drone.fireTimer = drone.fireInterval;

                    if (drone.hp <= 0) {
                        createExplosion(drone.pos, gameState.level);
                        sounds.explode(gameState.level);
                        destroy(drone);
                    }
                }
            }
        }
    });

    return drone;
}


export function spawnHealBot(gameState, sounds) {
    if ((gameState.upgrades.healBot || 0) <= 0 || get("healBot").length > 0) return;

    const girl = get("girl")[0];
    if (!girl) return;

    const bot = add([
        sprite("heal_bot", { width: 45, height: 45 }),
        pos(girl.pos.x - 80, girl.pos.y - 40),
        anchor("center"),
        scale(1),
        z(100),
        "healBot",
        {
            state: "idle", // idle, warping, healing
            timer: 0,
            targetTurret: null,
        }
    ]);

    bot.onUpdate(() => {
        if (gameState.paused) return;

        // Breathing Animation: Slow stretching and shrinking
        // Using time() to ensure smooth continuity
        const breatheSpeed = 2;
        const breatheAmp = 0.05;
        const s = 1 + Math.sin(time() * breatheSpeed) * breatheAmp;
        bot.scale = vec2(s, 1 / s); // Conservation of "volume" effect

        bot.timer -= dt();

        if (bot.state === "idle") {
            if (bot.timer <= 0) {
                // Find most damaged turret - avoid heavy filter every frame
                const turrets = get("turret");
                let mostDamaged = null;
                let lowestHpRatio = 1.0;

                for (let i = 0; i < turrets.length; i++) {
                    const t = turrets[i];
                    if (!t.exists()) continue;
                    const max = t.maxHp || 1;
                    const ratio = t.hp / max;
                    if (ratio < lowestHpRatio && ratio < 1.0) {
                        lowestHpRatio = ratio;
                        mostDamaged = t;
                    }
                }

                if (mostDamaged) {
                    bot.targetTurret = mostDamaged;
                    bot.state = "warping";
                    bot.timer = 0.5; // Prep warp
                } else {
                    bot.timer = 1.5; // Check again soon
                }
            }
        } else if (bot.state === "warping") {
            if (bot.timer <= 0) {
                if (bot.targetTurret && bot.targetTurret.exists()) {
                    createHealEffect(bot.pos); // Warp out

                    // Safe repositioning near turret (using angle and distance to avoid overlap)
                    const angle = rand(0, 360);
                    const dist = rand(55, 65);
                    const offset = vec2(Math.cos(angle * Math.PI / 180), Math.sin(angle * Math.PI / 180)).scale(dist);
                    const nextX = bot.targetTurret.pos.x + offset.x;
                    const nextY = bot.targetTurret.pos.y + offset.y;
                    if (Number.isFinite(nextX) && Number.isFinite(nextY)) {
                        bot.pos = vec2(nextX, nextY);
                    }

                    createHealEffect(bot.pos); // Warp in
                    if (sounds.pyuin) sounds.pyuin();

                    bot.state = "healing";
                    bot.timer = 1.0; // Wait before healing
                } else {
                    bot.state = "idle";
                    bot.timer = 0.5;
                }
            }
        } else if (bot.state === "healing") {
            if (bot.timer <= 0) {
                if (bot.targetTurret && bot.targetTurret.exists()) {
                    // Apply Repair
                    const healAmt = 1;
                    bot.targetTurret.hp = Math.min(bot.targetTurret.maxHp, bot.targetTurret.hp + healAmt);

                    // Update HP bar
                    const hpbar = bot.targetTurret.get("hpbar")[0];
                    if (hpbar) {
                        const fw = (bot.targetTurret.barW || 40);
                        const mhp = (bot.targetTurret.maxHp || 1);
                        hpbar.width = (bot.targetTurret.hp / mhp) * fw;
                    }

                    // Visual Feedback - Optmized with raw math
                    const tPos = bot.targetTurret.pos;
                    const bPos = bot.pos;
                    const dx = tPos.x - bPos.x;
                    const dy = tPos.y - bPos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

                    const beam = add([
                        rect(4, distance),
                        pos(bPos.x, bPos.y),
                        rotate(angle - 90),
                        color(0, 255, 100),
                        opacity(1),
                        z(101)
                    ]);

                    beam.onUpdate(() => {
                        beam.opacity -= dt() * 3;
                        if (beam.opacity <= 0) destroy(beam);
                    });

                    createHealEffect(tPos); // Effect on target
                    if (sounds.pyuin) sounds.pyuin();
                    bot.state = "idle";
                    bot.timer = 4.0; // Interval between repairs
                } else {
                    bot.state = "idle";
                    bot.timer = 0.5;
                }
            }
        }
    });

    return bot;
}

export function spawnDecoy(gameState, sounds) {
    if (get("decoy").length > 0) return;

    const girl = get("girl")[0];
    if (!girl) return;

    // Spawn point: Randomly at top or bottom edge, further right in front of core
    // Target area: x around 400-500, y near 40 or height()-120
    const edgeY = rand() < 0.5 ? 150 : (height() - 200);
    const spawnPos = vec2(1100, edgeY);

    const d = add([
        sprite("girl", { width: 320, height: 320 }),
        pos(spawnPos),
        anchor("center"),
        scale(0.4), // Smaller than real girl
        color(100, 200, 255),
        opacity(0.6),
        area(),
        z(115),
        "decoy",
        {
            hp: 3,
            maxHp: 3,
        }
    ]);

    // Holographic FX
    d.onUpdate(() => {
        if (gameState.paused) return;
        d.opacity = wave(0.4, 0.7, time() * 8);
        d.pos.y = spawnPos.y + Math.sin(time() * 4) * 8;
    });

    return d;
}
