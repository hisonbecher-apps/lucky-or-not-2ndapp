const fs = require('fs');

const filePath = 'src/components/ShortStrawGame.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update header to avoid duplicate "Pick a Straw" text
content = content.replace(
    "{gameOver ? 'Game Over' : (isMultiplayer ? 'Multiplayer Match' : 'Pick a Straw')}",
    "{gameOver ? 'Game Over' : (isMultiplayer ? 'Multiplayer Match' : 'Short Straw')}"
);

fs.writeFileSync(filePath, content);
console.log('Successfully removed redundant text from Short Straw header');
