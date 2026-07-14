const fs = require('fs');

// 1. Update LuckHorseshoe.tsx
const horseshoePath = 'src/components/LuckHorseshoe.tsx';
let hContent = fs.readFileSync(horseshoePath, 'utf8');
hContent = hContent.replace(
    'className="relative flex items-center justify-center p-4 bg-white rounded-3xl overflow-hidden shadow-inner"',
    'className="relative flex items-center justify-center overflow-hidden"'
);
fs.writeFileSync(horseshoePath, hContent);

// 2. Update UserPage.tsx
const userPagePath = 'src/pages/UserPage.tsx';
let uContent = fs.readFileSync(userPagePath, 'utf8');

const oldFragment = `                      {indicator.label === 'Weekly' ? (
                          <div className="flex flex-col items-center justify-center h-full -mt-2">
                              <div className="scale-[0.55] origin-center -my-12">
                                  <LuckHorseshoe days={getWeeklyCloverData()} size={280} />
                              </div>
                              <div className="text-xl font-black text-slate-900 mt-2">%{indicator.score}</div>
                          </div>
                      ) : (`;

const newFragment = `                      {indicator.label === 'Weekly' ? (
                          <div className="flex flex-col items-center justify-center h-full">
                              <div className="mt-2">
                                  <LuckHorseshoe days={getWeeklyCloverData()} size={140} />
                              </div>
                              <div className="text-xl font-black text-slate-900 mt-2">%{indicator.score}</div>
                          </div>
                      ) : (`;

if (uContent.includes("scale-[0.55]")) {
    uContent = uContent.replace(oldFragment, newFragment);
} else {
    // Aggressive replace for the Weekly block
    uContent = uContent.replace(
        /\{indicator\.label === 'Weekly' \? \([\s\S]*?\) : \(/,
        `{indicator.label === 'Weekly' ? (
                          <div className="flex flex-col items-center justify-center h-full">
                              <div className="mt-2">
                                  <LuckHorseshoe days={getWeeklyCloverData()} size={140} />
                              </div>
                              <div className="text-lg font-black text-slate-900 mt-1">%{indicator.score}</div>
                          </div>
                      ) : (`
    );
}

fs.writeFileSync(userPagePath, uContent);

console.log("Successfully refined Horseshoe layout in both files.");
