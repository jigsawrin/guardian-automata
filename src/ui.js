import { sounds } from './audio.js';
import { CONTROLS } from './constants.js';


export function showUpgradePicker(gameState, player, girl, cards, onComplete) {
    console.assert(gameState && typeof gameState.level === 'number', "showUpgradePicker: gameState must be an object");
    console.assert(Array.isArray(cards), "showUpgradePicker: cards must be an array");
    gameState.paused = true;
    // Accurate detection using actual browser window width
    const isMobile = window.innerWidth < 800;
    const pickerW = isMobile ? width() * 0.95 : 900;
    const pickerH = isMobile ? height() * 0.9 : 500;

    const picker = add([
        rect(pickerW, pickerH),
        pos(width() / 2, height() / 2),
        color(10, 10, 20, 0.95),
        anchor("center"),
        outline(4, rgb(0, 255, 255)),
        fixed(),
        z(2000),
    ]);

    picker.add([
        text("LEVEL UP!", { size: isMobile ? 48 : 32, font: "monospace" }),
        pos(0, isMobile ? -pickerH / 2 + 60 : -200),
        anchor("center"),
        color(0, 255, 255)
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
        // Vertical stack for mobile, horizontal for PC
        const x = isMobile ? 0 : (-300 + i * 300);
        const y = isMobile ? (-pickerH / 2 + 180 + i * 140) : 20;

        const cardW = isMobile ? pickerW - 40 : 260;
        const cardH = isMobile ? 120 : 350;

        const cardBg = picker.add([
            rect(cardW, cardH),
            pos(x, y),
            color(40, 40, 60),
            anchor("center"),
            area(),
            outline(2, rgb(100, 100, 150)),
            "card_btn"
        ]);

        const titleText = typeof card.title === 'function' ? card.title(gameState) : card.title;
        cardBg.add([
            text(titleText, { size: isMobile ? 24 : 20, width: cardW - 20, font: "monospace" }),
            pos(isMobile ? -cardW / 2 + 10 : 0, isMobile ? -35 : -120),
            anchor(isMobile ? "left" : "center"),
            color(255, 255, 255)
        ]);

        const descText = typeof card.desc === 'function' ? card.desc(gameState) : card.desc;
        cardBg.add([
            text(descText, { size: isMobile ? 18 : 14, width: cardW - 20, font: "monospace" }),
            pos(isMobile ? -cardW / 2 + 10 : 0, isMobile ? 15 : 0),
            anchor(isMobile ? "left" : "center"),
            color(200, 200, 200)
        ]);

        cardBg.onHover(() => {
            cardBg.color = rgb(60, 60, 90);
            cardBg.outline.color = rgb(0, 255, 255);
        });
        cardBg.onHoverEnd(() => {
            cardBg.color = rgb(40, 40, 60);
            cardBg.outline.color = rgb(100, 100, 150);
        });
        cardBg.onClick(() => {
            card.effect(gameState, player, girl);
            destroy(picker);
            gameState.paused = false;
            if (onComplete) onComplete();
        });
    });
}

export function showBanner(bannerTextContent, bgColor, onFinish) {
    console.assert(typeof bannerTextContent === 'string', "showBanner: bannerTextContent must be a string");
    console.assert(bgColor && typeof bgColor.r === 'number', "showBanner: bgColor must be a color object");
    const bannerBg = add([
        rect(width(), 100),
        pos(width(), height() / 2 - 50),
        color(bgColor),
        opacity(0.6),
        fixed(),
        z(1000)
    ]);
    const bannerText = add([
        text(bannerTextContent, { size: 48, font: "monospace" }),
        pos(width(), height() / 2),
        anchor("center"),
        color(255, 255, 255),
        fixed(),
        z(1001)
    ]);

    tween(width(), width() / 2, 0.5, (v) => {
        bannerBg.pos.x = v - width() / 2;
        bannerText.pos.x = v;
    }, easings.easeOutQuad).onEnd(() => {
        wait(1, () => {
            tween(width() / 2, -width(), 0.5, (v) => {
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
