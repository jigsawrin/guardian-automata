import { sounds } from './audio.js';
import { createExplosion, findPath, createHealEffect } from './utils.js';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from './constants.js';

export function dropResource(p, level = 1, forceType = null, count = 1) {
    console.assert(p && typeof p.x === 'number' && typeof p.y === 'number', "dropResource: p must be a vector (vec2)");

    for (let i = 0; i < count; i++) {
        const r = rand();
        const type = forceType || (r < 0.03 ? "battery" : "scrap");

        // Use Number.isFinite for robust position validation
        const isValidPos = p && Number.isFinite(p.x) && Number.isFinite(p.y);
        // Add slight random offset for multiple drops to prevent overlap
        let dropPos = isValidPos ? vec2(p.x + rand(-20, 20), p.y + rand(-20, 20)) : vec2(rand(100, 1180), rand(140, 580));

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

        if (currentWave === 8 || currentWave === 16 || currentWave === 25) {
            let bossConfig = {
                sprite: "enemy",
                size: 500,
                color: rgb(255, 80, 80),
                hp: 30, // Buffed slightly from 25
                speed: 15,
                tag: "boss_8"
            };

            if (currentWave === 16) {
                bossConfig = {
                    sprite: "enemy", // Heavy look
                    size: 650,
                    color: rgb(100, 100, 255),
                    hp: 800, // Buffed from 500 (v3.9.5)
                    speed: 12,
                    tag: "boss_16"
                };
            } else if (currentWave === 25) {
                bossConfig = {
                    sprite: "enemy_assassin",
                    size: 800,
                    color: rgb(255, 50, 50),
                    hp: 2000, // Buffed from 1000 (v3.9.5)
                    speed: 10,
                    tag: "boss_25"
                };
            }

            const e = add([
                sprite(bossConfig.sprite, { width: bossConfig.size, height: bossConfig.size }),
                color(bossConfig.color),
                pos(MAP_WIDTH + 150, MAP_HEIGHT / 2),
                area({ scale: 0.8 }), // Scaled area for giant boss
                anchor("center"),
                "enemy",
                "boss",
                bossConfig.tag,
                z(80),
                {
                    speed: bossConfig.speed,
                    hp: bossConfig.hp,
                    maxHp: bossConfig.hp,
                    targetOffset: 0,
                    stepTimer: 0,
                    shieldHP: 0,
                    maxShieldHP: 0,
                    isMega: currentWave === 8 || currentWave === 16 || currentWave === 25, // Flag for one-hit kill
                    barW: 400,
                    invulnTimer: 0, // v3.9.1 fix
                    isGoldShield: false // v3.9.1 fix
                }
            ]);

            const barWidth = 400;
            e.add([
                rect(barWidth, 20),
                pos(0, -(bossConfig.size / 2 + 30)),
                color(30, 30, 30),
                outline(4),
                anchor("center"),
                z(110),
            ]);
            e.add([
                rect(barWidth, 20),
                pos(-barWidth / 2, -(bossConfig.size / 2 + 30)),
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

        // Shielded enemies: Randomly from Wave 6 onwards, increased to 50% chance
        let shieldProb = 0;
        if (currentWave >= 6) {
            shieldProb = 0.5;
        }

        // Check for "First Spawn" forced shield OR random chance
        let isIntroSpawn = false;
        if (!gameState.spawnedEnemyTypes) gameState.spawnedEnemyTypes = [];
        if (!gameState.spawnedEnemyTypes.includes(type)) {
            if (type !== "normal") isIntroSpawn = true;
            gameState.spawnedEnemyTypes.push(type);
        }

        let isShielded = (rand() < shieldProb || isIntroSpawn) && currentWave !== 8;

        let shieldHP = 0;
        let isGoldShield = false;
        if (isShielded) {
            // v3.8.4: Gold Shield chance (20% total from W22 onwards)
            if (currentWave >= 22 && rand() < 0.4 && !isIntroSpawn) {
                isGoldShield = true;
                // v3.8.8: Dynamic Gold HP Scaling
                if (currentWave >= 26) shieldHP = 5;
                else if (currentWave >= 24) shieldHP = 3;
                else shieldHP = 2; // W22-23
            } else if (isIntroSpawn) {
                // Updated Intro Spawn Shield HP: 1
                shieldHP = 1;
            } else {
                // Updated Normal Shield HP: 10
                shieldHP = 10;
            }
        }
        // Speed: base + wave * scaling (Aggressive)
        // HP: base + floor((wave - 1) / 5) (Balanced v5.1.6)
        const hpBoost = Math.floor((currentWave - 1) / 5);
        const hpMult = currentWave >= 22 ? (2.0 + (currentWave - 22) * 0.2) : 1.0;
        const speedMult = currentWave >= 22 ? 1.5 : 1.0;
        const specs = {
            heavy: { w: 120, h: 120, col: rgb(150, 150, 255), speed: (30 + currentWave * 4) * speedMult, hp: Math.floor((2 + hpBoost) * hpMult), areaScale: 0.2, barW: 40, barY: -60, sprite: "enemy" },
            ranged: { w: 70, h: 70, col: rgb(0, 255, 255), speed: (50 + currentWave * 3) * speedMult, hp: Math.floor((2 + hpBoost) * hpMult), areaScale: 0.2, barW: 20, barY: -40, sprite: "enemy" },
            warp: { w: 80, h: 80, col: rgb(255, 255, 255), speed: (20 + currentWave * 2) * speedMult, hp: Math.floor((1 + hpBoost) * hpMult), areaScale: 0.2, barW: 25, barY: -50, sprite: "enemy_warp" },
            assassin: { w: 80, h: 80, col: rgb(255, 100, 100), speed: (40 + currentWave * 3) * speedMult, hp: Math.floor((1 + hpBoost) * hpMult), areaScale: 0.2, barW: 25, barY: -50, sprite: "enemy_assassin" },
            jammer: { w: 100, h: 100, col: rgb(255, 255, 200), speed: (30 + currentWave * 2) * speedMult, hp: Math.floor((2 + hpBoost) * hpMult), areaScale: 0.2, barW: 35, barY: -55, sprite: "enemy_jammer" },
            normal: { w: 90, h: 90, col: rgb(255, 180, 180), speed: (45 + currentWave * 5) * speedMult, hp: Math.floor((1 + hpBoost) * hpMult), areaScale: 0.2, barW: 30, barY: -45, sprite: "enemy" }
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
                isGoldShield: isGoldShield, // v3.8.7
                invulnTimer: 0, // v3.8.7
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
                color(isGoldShield ? rgb(255, 215, 0) : rgb(0, 150, 255)),
                opacity(0.3),
                outline(2, isGoldShield ? rgb(255, 255, 200) : rgb(255, 255, 255)),
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
                // v3.8.7: Flicker effect during I-Frames
                if (e.invulnTimer > 0) {
                    shieldVisual.opacity = wave(0.1, 0.8, time() * 30); // Fast flicker
                    shieldVisual.radius = s.w * 0.6 + wave(-4, 4, time() * 30);
                    return;
                }
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
                    bcol: bcol,
                    sonicTimer: 5.0,
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

    export function spawnMeteor(gameState, sounds, applyDamage) {
        // Target logic: find a random enemy or an area with most enemies
        const targets = get("enemy");
        let targetPos;
        if (targets.length > 0) {
            const randomEnemy = choose(targets);
            targetPos = randomEnemy.pos;
        } else {
            targetPos = vec2(rand(500, 1100), rand(150, height() - 150));
        }

        const startPos = targetPos.add(vec2(400, -800)); // Drop from top-right

        const m = add([
            circle(40),
            pos(startPos),
            color(255, 100, 0),
            outline(8, rgb(255, 255, 255)),
            anchor("center"),
            area(),
            z(150),
            "meteor",
            {
                target: targetPos,
                speed: 1200,
                exploded: false
            }
        ]);

        // Add trail/glow
        const glow = m.add([
            circle(60),
            color(255, 50, 0),
            opacity(0.4),
            anchor("center"),
            z(-1)
        ]);

        m.onUpdate(() => {
            if (gameState.paused) return;
            const diff = m.target.sub(m.pos);
            if (diff.len() < 30 && !m.exploded) {
                m.exploded = true;
                // Explosion!
                shake(5);
                if (sounds.explode) sounds.explode(50); // Ultimate explosion sound

                // Damage AOE
                const explosionRadius = 350;
                const enemies = get("enemy");
                enemies.forEach(e => {
                    const dist = e.pos.dist(m.pos);
                    if (dist < explosionRadius) {
                        // Damage falls off with distance but it's very high at center
                        const dmg = map(dist, 0, explosionRadius, 50, 10);
                        // Pass isHit=true so it breaks shields fairly
                        if (applyDamage) applyDamage(e, dmg, true);
                    }
                });

                // Visual effect
                const exp = add([
                    circle(10),
                    pos(m.pos),
                    color(255, 200, 0),
                    opacity(1),
                    anchor("center"),
                    z(200)
                ]);
                exp.onUpdate(() => {
                    exp.radius += dt() * 1200;
                    exp.opacity -= dt() * 1.5;
                    if (exp.opacity <= 0) destroy(exp);
                });

                destroy(m);
            } else {
                m.move(diff.unit().scale(m.speed));
                // Add particles
                const p = add([
                    circle(rand(5, 15)),
                    pos(m.pos.add(vec2(rand(-20, 20), rand(-20, 20)))),
                    color(255, rand(50, 150), 0),
                    opacity(0.8),
                    move(diff.unit().scale(-0.5), 100),
                    z(149),
                    "particle"
                ]);
                p.onUpdate(() => {
                    p.opacity -= dt() * 3;
                    if (p.opacity <= 0) destroy(p);
                });
            }
        });
    }

    export function spawnSonicWave(turret, targetEnemy, gameState, applyDamage) {
        if (!turret.exists()) return;

        const count = gameState.upgrades.sonicWaveLvl || 1;
        const targetPos = targetEnemy ? targetEnemy.pos : turret.pos.add(vec2(500, 0));
        const dir = targetPos.sub(turret.pos).unit();

        for (let i = 0; i < count; i++) {
            // Offset for multiple waves
            const offset = (i - (count - 1) / 2) * 40;
            const sideDir = vec2(-dir.y, dir.x).scale(offset);
            const spawnPos = turret.pos.add(sideDir);

            const sw = add([
                // Using a stylized ')' for the crescent shape
                text(")", { size: 100, font: "monospace" }),
                pos(spawnPos),
                rotate(Math.atan2(dir.y, dir.x) * 180 / Math.PI),
                anchor("center"),
                color(200, 100, 255),
                opacity(0.8),
                outline(4, rgb(255, 255, 255)),
                area({ scale: vec2(0.5, 1.2) }), // Wide horizontal hitbox
                move(dir, 600),
                offscreen({ destroy: true }),
                z(110),
                "sonic_wave",
                {
                    dmg: 5 + (gameState.upgrades.turretDmgMod * 2),
                    hitEnemies: new Set()
                }
            ]);

            // Add glow
            sw.add([
                text(")", { size: 110, font: "monospace" }),
                anchor("center"),
                color(255, 255, 255),
                opacity(0.3),
                z(-1)
            ]);

            sw.onUpdate(() => {
                if (gameState.paused) return;
                sw.opacity = wave(0.4, 0.8, time() * 10);

                // PIERCING COLLISION: Manually check against frame enemies or use onCollide
                // For simplicity and multi-hit prevention, we use a custom check
                const enemies = get("enemy");
                enemies.forEach(e => {
                    if (sw.hitEnemies.has(e.id)) return;
                    if (sw.isColliding(e)) {
                        sw.hitEnemies.add(e.id);
                        if (applyDamage) applyDamage(e, sw.dmg, true);
                    }
                });
            });
        }
    }
