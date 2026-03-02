const fs = require('fs');
let html = fs.readFileSync('C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html', 'utf8');

// Replace the bad block
html = html.replace(`            startDay();\r\n                    });\r\n                }\r\n            });\r\n\r\n            startWave();`, `            startDay();`);

html = html.replace(`            startDay();\n                    });\n                }\n            });\n\n            startWave();`, `            startDay();`);

fs.writeFileSync('C:\\Users\\nuies\\.gemini\\antigravity\\scratch\\guardian-automata\\index.html', html);
console.log("Syntax fixed!");
