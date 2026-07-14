const fs = require('fs');

const filePath = 'src/components/ShortStrawGame.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add state for currentPlayerIndex
if (!content.includes('currentPlayerIndex')) {
    content = content.replace(
        'const [isGameStarted, setIsGameStarted] = useState(false);',
        'const [isGameStarted, setIsGameStarted] = useState(false);\n  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);'
    );
}

// 2. Reset turn on game init
if (!content.includes('setCurrentPlayerIndex(0);')) {
    content = content.replace(
        'setLoserName(null);',
        'setLoserName(null);\n    setCurrentPlayerIndex(0);'
    );
}

// 3. Increment turn on pull
if (!content.includes('setCurrentPlayerIndex(prev => (prev + 1) % players.length);')) {
    content = content.replace(
        'playBottleResult();',
        'playBottleResult();\n      setCurrentPlayerIndex(prev => (prev + 1) % players.length);'
    );
}

// 4. Update UI Header
const headerRegex = /<h3 className="text-\[10px\] font-bold text-slate-400 uppercase tracking-widest mb-0">[\s\S]*?<\/h3>[\s\S]*?<p className="text-slate-900 font-black text-base leading-tight mt-1">[\s\S]*?<\/p>/;
const newHeader = `<h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0">
          {gameOver ? 'Game Over' : (isMultiplayer ? 'Multiplayer Match' : 'Pick a Straw')}
        </h3>
        <p className="text-slate-900 font-black text-base leading-tight mt-1">
          {gameOver ? (
            \`\${loserName} got the short straw!\`
          ) : (
            isMultiplayer ? (
              isMyTurn ? (
                <span className="inline-flex items-center gap-2 px-6 py-1.5 bg-emerald-500 text-white rounded-full font-black animate-pulse shadow-lg shadow-emerald-500/20 text-xs">
                  <Sparkles size={14} fill="white" />
                  {user?.name}, YOUR MOVE NOW!
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-6 py-1.5 bg-amber-100 text-amber-700 rounded-full font-black border border-amber-200 text-xs uppercase">
                  {currentTurnName}, YOU ARE NEXT!
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-2 px-6 py-1.5 bg-green-500 text-white rounded-full font-black shadow-lg shadow-green-500/20 text-sm uppercase">
                <Sparkles size={14} fill="white" />
                {players[currentPlayerIndex]} pick a straw
              </span>
            )
          )}
        </p>`;

content = content.replace(headerRegex, newHeader);

fs.writeFileSync(filePath, content);
console.log('Successfully updated Short Straw game with turn-based instructions');
