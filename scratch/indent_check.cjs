const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\levyc\\fauves-platform\\src\\pages\\EventPanelV2.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.includes('return (') && index > 40) {
        console.log(`${index+1}: ${JSON.stringify(line)}`);
    }
});
