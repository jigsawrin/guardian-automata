import { sounds } from './audio.js';
import { CONTROLS } from './constants.js';


export function showUpgradePicker(gameState, player, girl, cards, onComplete, isMobile = false) {
    gameState.paused = true;
    const pickerW = isMobile ? width() * 0.98 : 900;
    const pickerH = isMobile ? height() * 0.95 : 560;

    const picker = add([
        rect(pickerW, pickerH),
        pos(width() / 2, height() / 2),
        color(5, 5, 10, 0.98),
        anchor("center"),
        outline(4, rgb(0, 255, 255)),
        fixed(),
        z(2000),
        "ui_picker"
    ]);

    picker.add([
        text("LEVEL UP!", { size: isMobile ? 42 : 36, font: "monospace" }),
        pos(0, isMobile ? -pickerH / 2 + 60 : -220),
        anchor("center"),
        color(0, 255, 255),
        outline(2, rgb(0, 0, 0))
    ]);

    // Filter cards based on conditions (if any)
    const availableCards = cards.filter(card => {
        if (card.condition) return card.condition(gameState);
        return true;
    });

    // Choose 3 random unique cards from available pool
    const shuffled = [...availableCards].sort(() => 0.5 - Math.random());
    const choices = shuffled.slice(0, 3);

    choices.forEach((card, i) => {
        // Vertical stack for mobile (more space), horizontal for PC
        const x = isMobile ? 0 : (-300 + i * 300);
        const y = isMobile ? (-pickerH / 2 + 200 + i * 160) : 40;

        const mockGS = (l) => ({ level: l, upgrades: { homing: 1, drone: 1, healBot: 1, omegaStrike: 0, roboCircus: 0 } });
        const isOverload = card.isOverload || (card.condition && card.condition(mockGS(50)) && !card.condition(mockGS(49)));
        const isRare = card.isRare || false;
        const cardW = isMobile ? pickerW - 40 : 260;
        const cardH = isMobile ? 140 : 380;

        let bgColor = rgb(40, 40, 60);
        let outlineColor = rgb(100, 100, 150);
        let outlineWidth = 2;

        if (isOverload) {
            bgColor = rgb(60, 50, 20);
            outlineColor = rgb(255, 215, 0);
            outlineWidth = 4;
        } else if (isRare) {
            bgColor = rgb(40, 20, 60);
            outlineColor = rgb(200, 50, 255);
            outlineWidth = 3;
        }

        const cardBg = picker.add([
            rect(cardW, cardH),
            pos(x, y),
            color(bgColor),
            anchor("center"),
            area(),
            outline(outlineWidth, outlineColor),
            "card_btn",
            { isOverload, isRare }
        ]);

        if (isOverload) {
            cardBg.add([
                rect(cardW, cardH),
                anchor("center"),
                color(255, 255, 255),
                opacity(0.1),
                z(-1)
            ]);
        }

        const titleText = typeof card.title === 'function' ? card.title(gameState) : card.title;
        cardBg.add([
            text(titleText, { size: isMobile ? 22 : 22, width: cardW - 30, font: "monospace" }),
            pos(isMobile ? -cardW / 2 + 20 : 0, isMobile ? -35 : -130),
            anchor(isMobile ? "left" : "center"),
            color(255, 255, 255),
            outline(2, rgb(0, 0, 0))
        ]);

        const descText = typeof card.desc === 'function' ? card.desc(gameState) : card.desc;
        cardBg.add([
            text(descText, { size: isMobile ? 14 : 16, width: cardW - 30, font: "monospace" }),
            pos(isMobile ? -cardW / 2 + 20 : 0, isMobile ? 15 : 0),
            anchor(isMobile ? "left" : "center"),
            color(200, 200, 200),
            outline(1, rgb(0, 0, 0))
        ]);

        cardBg.onHover(() => {
            cardBg.color = isOverload ? rgb(80, 70, 30) : (isRare ? rgb(60, 30, 90) : rgb(60, 60, 90));
            cardBg.outline.color = rgb(0, 255, 255);
        });
        cardBg.onHoverEnd(() => {
            cardBg.color = bgColor;
            cardBg.outline.color = outlineColor;
        });
        cardBg.onClick(() => {
            if (picker.isClosing) return;
            picker.isClosing = true;
            card.effect(gameState, player, girl);
            destroy(picker);
            gameState.paused = false;
            if (onComplete) onComplete();
        });
    });
}

export function showBanner(bannerTextContent, bgColor, onFinish, isMobile = false) {
    const bannerBg = add([
        rect(width(), isMobile ? 60 : 100),
        pos(width(), height() / 2 - (isMobile ? 30 : 50)),
        color(bgColor),
        opacity(0.6),
        fixed(),
        z(1000)
    ]);
    const bannerText = add([
        text(bannerTextContent, {
            size: isMobile ? 24 : 48,
            font: "monospace",
            width: isMobile ? width() - 40 : undefined
        }),
        pos(width(), height() / 2),
        anchor("center"),
        color(255, 255, 255),
        fixed(),
        z(1001)
    ]);

    tween(width() + width() / 2, width() / 2, 0.5, (v) => {
        bannerBg.pos.x = v - width() / 2;
        bannerText.pos.x = v;
    }, easings.easeOutQuad).onEnd(() => {
        wait(1.5, () => {
            tween(width() / 2, -width() / 2, 0.5, (v) => {
                bannerBg.pos.x = v - width() / 2;
                bannerText.pos.x = v;
            }, easings.easeInQuad).onEnd(() => {
                destroy(bannerBg);
                destroy(bannerText);
                if (onFinish) onFinish();
            });
        });
    });
}

export function showLevelUpEffect(isMobile = false) {
    // Sound FX
    sounds.shupeen();

    // Visual Group for centered text
    const group = add([
        pos(width() / 2, height() / 2),
        fixed(),
        z(2100)
    ]);

    // Glitzy sparkles
    for (let i = 0; i < 15; i++) {
        const angle = rand(0, 360);
        const dist = rand(50, 200);
        const p = group.add([
            pos(vec2(Math.cos(angle * Math.PI / 180) * 10, Math.sin(angle * Math.PI / 180) * 10)),
            rect(4, 4),
            color(0, 255, 255),
            anchor("center"),
            rotate(rand(0, 360)),
            opacity(1),
            scale(1),
            {
                dir: vec2(Math.cos(angle * Math.PI / 180), Math.sin(angle * Math.PI / 180)),
                speed: rand(100, 300)
            }
        ]);
        p.onUpdate(() => {
            p.pos = p.pos.add(p.dir.scale(p.speed * dt()));
            p.opacity -= dt() * 1.5;
            p.scale = p.scale.scale(0.95);
            if (p.opacity <= 0) destroy(p);
        });
    }

    // Expanding Ring
    const ring = group.add([
        pos(0, 0),
        circle(10),
        color(255, 255, 255),
        opacity(0.4),
        outline(2, rgb(0, 255, 255)),
        anchor("center"),
        scale(1)
    ]);
    ring.onUpdate(() => {
        ring.scale = ring.scale.add(vec2(dt() * 10));
        ring.opacity -= dt() * 1.5;
        if (ring.opacity <= 0) destroy(ring);
    });

    // Rich Text
    const txt = group.add([
        pos(0, 0),
        text("LEVEL UP!", {
            size: isMobile ? 42 : 64,
            font: "monospace",
            styles: { outline: { color: rgb(0, 0, 0), width: 4 } }
        }),
        anchor("center"),
        color(0, 255, 255),
        scale(0.1),
        opacity(1)
    ]);

    // Animation Lifecycle
    tween(0.1, 1.2, 0.4, (v) => txt.scale = vec2(v), easings.easeOutBack);
    wait(1.2, () => {
        tween(1, 0, 0.3, (v) => {
            txt.opacity = v;
            txt.pos.y -= 100 * dt(); // Floating up
        }, easings.easeInQuad).onEnd(() => destroy(group));
    });
}
