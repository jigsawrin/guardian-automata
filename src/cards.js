import { sounds } from './audio.js';
import { spawnDecoy, spawnDrone } from './entities.js';

export const UPGRADE_CARDS = [
    {
        id: "turret_hp",
        title: (gs) => `🛡️ 超強化装甲 Lv.${Math.floor(gs.upgrades.turretHpMod * 2 - 1)}`,
        desc: (gs) => `タレットの耐久力(HP)を${gs.upgrades.turretHpMod > 1.0 ? " さらに" : ""} 50% 上昇させます。`,
        effect: (gs) => { gs.upgrades.turretHpMod += 0.5; }
    },
    {
        id: "pierce",
        title: (gs) => `💎 徹甲貫通弾 Lv.${gs.upgrades.pierce + 1}`,
        desc: (gs) => `弾の貫通数を${gs.upgrades.pierce > 0 ? " さらに" : ""} +1 します（より多くの敵を貫通）。`,
        effect: (gs) => { gs.upgrades.pierce += 1; }
    },
    {
        id: "multi_shot",
        title: (gs) => `🚀 拡散同時発射 Lv.${gs.upgrades.multiShot + 1}`,
        desc: (gs) => `一度の射撃で${gs.upgrades.multiShot > 0 ? " さらに" : ""}複数の方向に弾を放ちます。`,
        effect: (gs) => { gs.upgrades.multiShot += 1; }
    },
    {
        id: "homing",
        title: "🎯 誘導ミサイル",
        desc: "弾が近くの敵を自動で追尾するようになります。",
        effect: (gs) => { gs.upgrades.homing = 1; },
        condition: (gs) => gs.upgrades.homing === 0
    },
    {
        id: "crit",
        title: (gs) => `🎲 ラッキーショット Lv.${Math.floor(gs.upgrades.critChance * 10 + 1)}`,
        desc: (gs) => `クリティカル発生率を${gs.upgrades.critChance > 0 ? " さらに" : ""} 10% 向上させます。`,
        effect: (gs) => { gs.upgrades.critChance += 0.1; }
    },
    {
        id: "fire_rate",
        title: (gs) => `⚡ 超速クロック Lv.${Math.floor((gs.upgrades.turretFireRateMod - 1) * 5 + 1)}`,
        desc: (gs) => `タレットの連射速度を${gs.upgrades.turretFireRateMod > 1.0 ? " さらに" : ""} 20% 向上させます。`,
        effect: (gs) => { gs.upgrades.turretFireRateMod += 0.2; }
    },
    {
        id: "range",
        title: (gs) => `🔭 望遠センサー Lv.${Math.floor((gs.upgrades.turretRangeMod - 1) * 5 + 1)}`,
        desc: (gs) => `タレットの射程を${gs.upgrades.turretRangeMod > 1.0 ? " さらに" : ""} 20% 拡大します。`,
        effect: (gs) => { gs.upgrades.turretRangeMod += 0.2; }
    },
    {
        id: "damage",
        title: (gs) => `💥 高熱粒子弾 Lv.${Math.floor((gs.upgrades.turretDmgMod - 1) * 4 + 1)}`,
        desc: (gs) => `タレットの攻撃力を${gs.upgrades.turretDmgMod > 1.0 ? " さらに" : ""} 25% 上昇させます。`,
        effect: (gs) => { gs.upgrades.turretDmgMod += 0.25; }
    },
    {
        id: "magnet",
        title: (gs) => `🧲 重力磁石 Lv.${Math.floor((gs.upgrades.pickupRadiusMod - 1) * 2.5 + 1)}`,
        desc: (gs) => `素材の回収範囲を${gs.upgrades.pickupRadiusMod > 1.0 ? " さらに" : ""} 40% アップします。`,
        effect: (gs) => { gs.upgrades.pickupRadiusMod += 0.4; }
    },
    {
        id: "player_speed",
        title: "👟 加速ブースター",
        desc: "自身の移動速度が 20% アップします。",
        effect: (gs, player) => { player.speed += 40; }
    },
    {
        id: "hp_repair",
        title: "🔧 自動リペア",
        desc: "コアの損傷を 50% 修復します。",
        effect: (gs, player, girl) => { girl.hp = Math.min(girl.maxHp, girl.hp + 50); }
    },
    {
        id: "turret_limit",
        title: (gs) => `🏗️ 分散ビルド Lv.${gs.upgrades.maxTurrets - 2}`,
        desc: (gs) => `タレットの同時設置上限を${gs.upgrades.maxTurrets > 3 ? " さらに" : ""} +1 します。`,
        effect: (gs) => { gs.upgrades.maxTurrets += 1; }
    },
    {
        id: "turret_cooldown",
        title: (gs) => `⚡ ナノマシンビルド Lv.${Math.floor((gs.upgrades.turretCooldownMod - 1) * 4 + 1)}`,
        desc: (gs) => `設置待ち時間を${gs.upgrades.turretCooldownMod > 1.0 ? " さらに" : ""} 25% 短縮します。`,
        effect: (gs) => { gs.upgrades.turretCooldownMod += 0.25; }
    },
    {
        id: "chain_lightning",
        title: (gs) => `⚡ ボルトアーク Lv.${gs.upgrades.chainLightning + 1}`,
        desc: (gs) => `着弾時の電撃連装数を${gs.upgrades.chainLightning > 0 ? " さらに" : ""}強化します。`,
        effect: (gs) => { gs.upgrades.chainLightning += 1; }
    },
    {
        id: "explosive_rounds",
        title: (gs) => `🔥 ナパーム弾頭 Lv.${gs.upgrades.explosiveRounds + 1}`,
        desc: (gs) => `着弾時の爆発範囲を${gs.upgrades.explosiveRounds > 0 ? " さらに" : ""}拡大します。`,
        effect: (gs) => { gs.upgrades.explosiveRounds += 1; }
    },
    {
        id: "bullet_size",
        title: (gs) => `🛡️ 巨大重力弾 Lv.${Math.floor((gs.upgrades.bulletSizeMod - 1) * 2.5 + 1)}`,
        desc: (gs) => `弾のサイズと判定を${gs.upgrades.bulletSizeMod > 1.0 ? " さらに" : ""} 40% 拡大します。`,
        effect: (gs) => { gs.upgrades.bulletSizeMod += 0.4; }
    },
    {
        id: "robo_circus",
        title: "🌌 ロボサーカス",
        desc: "追尾弾が2発同時に射出され、変幻自在な軌道で敵を殲滅します。",
        isRare: true,
        effect: (gs) => {
            gs.upgrades.roboCircus += 1;
        },
        condition: (gs) => gs.upgrades.homing > 0 && gs.upgrades.roboCircus === 0
    },
    {
        id: "ricochet",
        title: (gs) => `🏓 リフレクション弾 Lv.${gs.upgrades.ricochet + 1}`,
        desc: (gs) => `弾の反射回数を${gs.upgrades.ricochet > 0 ? " さらに" : ""} +1 します。`,
        effect: (gs) => { gs.upgrades.ricochet += 1; }
    },
    {
        id: "drone",
        title: "🛸 近接防衛ドローン",
        desc: "自動で敵を追尾し攻撃するドローンが出現します。攻撃のたびに耐久力が減少します。",
        isRare: true,
        effect: (gs) => { 
            gs.upgrades.drone = 1; 
            spawnDrone(gs, sounds);
        },
        condition: (gs) => gs.upgrades.drone === 0 && gs.level >= 10
    },
    {
        id: "heal_bot",
        title: "🤖 メンテナンス・ボット",
        desc: "損傷したタレットを自動で修理する自立型ロボットを配備します。敵の攻撃を受けません。",
        isRare: true,
        effect: (gs) => { gs.upgrades.healBot = 1; },
        condition: (gs) => gs.upgrades.healBot === 0 && gs.level >= 15
    },
    {
        id: "drone_upgrade",
        title: (gs) => `⚡ ドローン拡張プロトコル Lv.${gs.upgrades.droneLvl + 1}`,
        desc: (gs) => `ドローンの性能を${gs.upgrades.droneLvl > 0 ? " さらに" : ""}向上させます。`,
        effect: (gs) => {
            gs.upgrades.droneLvl += 1;
            const oldDroneCount = gs.upgrades.drone;
            if (gs.upgrades.droneLvl === 3) gs.upgrades.drone = 2;
            
            // If count increased, spawn the new one
            if (gs.upgrades.drone > oldDroneCount) {
                spawnDrone(gs, sounds);
            }

            get("drone").forEach(d => {
                d.maxHp = 1 + gs.upgrades.droneLvl;
                d.hp = Math.min(d.maxHp, d.hp + 1);
                d.fireInterval = Math.max(2.0, 5.0 - gs.upgrades.droneLvl);
            });
        },
        condition: (gs) => gs.upgrades.drone > 0 && gs.upgrades.droneLvl < 3
    },
    {
        id: "orbiting_projectiles",
        title: (gs) => `⚙️ 磁気旋回破片 Lv.${gs.upgrades.orbitingProjectiles + 1}`,
        desc: (gs) => `旋回する鉄の塊を${gs.upgrades.orbitingProjectiles > 0 ? " さらに" : ""} +1 します。`,
        effect: (gs) => { gs.upgrades.orbitingProjectiles += 1; }
    },
    {
        id: "holographic_decoy",
        title: "💠 ホログラフィック・デコイ",
        desc: "拠点の前に囮（デコイ）を設置します。敵の視線を引きつけますが、一定回数攻撃を受けると消滅します。",
        isRare: true,
        effect: (gs) => { 
            gs.upgrades.holographicDecoy = 1; 
            spawnDecoy(gs, sounds);
        },
        condition: (gs) => gs.level >= 25 && gs.upgrades.holographicDecoy === 0
    },
    {
        id: "sonic_wave",
        title: "📡 ソニックウェーブ",
        desc: "全タレットが 5秒ごとに 巨大な貫通衝撃波を放ちます。衝撃波は敵を追尾します。",
        isRare: true,
        effect: (gs) => { 
            gs.upgrades.sonicWave = 1;
            gs.upgrades.sonicWaveLvl = 1;
        },
        condition: (gs) => gs.level >= 30 && gs.upgrades.sonicWave === 0
    },
    {
        id: "sonic_wave_upgrade",
        title: (gs) => `📡 ソニックウェーブ Lv.${gs.upgrades.sonicWaveLvl + 1}`,
        desc: "同時発射される衝撃波の数が増加します。（最大3本）",
        isRare: true,
        effect: (gs) => { 
            gs.upgrades.sonicWaveLvl = Math.min(3, gs.upgrades.sonicWaveLvl + 1);
        },
        condition: (gs) => gs.upgrades.sonicWave > 0 && gs.upgrades.sonicWaveLvl < 3 && Math.random() < 0.1
    },
    {
        id: "meteor_fall",
        title: "☄️ 【極大魔法】メテオ・フォール",
        desc: "戦場に巨大な隕石を落とし、広範囲の敵を消滅させます。一定周期で自動的に発動します。",
        isOverload: true,
        effect: (gs) => { gs.upgrades.meteorFall = 1; },
        condition: (gs) => gs.level >= 50 && gs.upgrades.meteorFall === 0
    },
];
