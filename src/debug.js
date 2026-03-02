export function initDebugUI() {
    window.addEventListener("error", (event) => {
        showScreenError(`ERROR: ${event.message}\nat ${event.filename}:${event.lineno}`);
    });

    // Override console.assert to show on screen
    const originalAssert = console.assert;
    console.assert = (condition, ...data) => {
        originalAssert.apply(console, [condition, ...data]);
        if (!condition) {
            showScreenError(`ASSERTION FAILED: ${data.join(" ")}`);
        }
    };
}

export function showScreenError(msg) {
    // Attempt to use Kaboom if initialized
    if (typeof add === 'function') {
        try {
            add([
                text(msg, { size: 16, width: width() - 40, font: "monospace" }),
                pos(20, 20),
                color(255, 0, 0),
                fixed(),
                z(10000),
                lifespan(10, { fade: 2 }),
            ]);
        } catch (e) {
            fallbackError(msg);
        }
    } else {
        fallbackError(msg);
    }
}

function fallbackError(msg) {
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.top = "10px";
    div.style.left = "10px";
    div.style.color = "red";
    div.style.background = "rgba(0,0,0,0.8)";
    div.style.padding = "10px";
    div.style.zIndex = "10001";
    div.style.fontFamily = "monospace";
    div.innerText = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 10000);
}
