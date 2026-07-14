const fs = require('fs');

const filePath = 'src/components/ShortStrawGame.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Remove redundant "Short Straw" subtitle in local mode
content = content.replace(
    "{gameOver ? 'Game Over' : (isMultiplayer ? 'Multiplayer Match' : 'Short Straw')}",
    "{gameOver ? 'Game Over' : (isMultiplayer ? 'Multiplayer Match' : '')}"
);

fs.writeFileSync(filePath, content);
console.log('Successfully removed redundant game title subtitle');
极
