const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\levyc\\fauves-platform\\src\\pages\\EventPanelV2.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 594; i < 610; i++) {
    console.log(`${i+1}: ${JSON.stringify(lines[i])}`);
}
