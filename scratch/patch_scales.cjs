const fs = require('fs');

const filePath = 'src/pages/UserPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Safe Import Addition
if (!content.includes("import LuckScales")) {
    const importRegex = /import LuckHorseshoe from '\.\.\/components\/LuckHorseshoe';/;
    content = content.replace(importRegex, "import LuckHorseshoe from '../components/LuckHorseshoe';\nimport LuckScales from '../components/LuckScales';");
}

// 2. Safe Monthly Logic Injection
// Find the Weekly block and prepend Monthly
const weeklySearch = /\{indicator\.label === 'Weekly' \? \(/;
const monthlySubstitution = `{indicator.label === 'Monthly' ? (
                          <div className="flex flex-col items-center justify-center h-full">
                              <div className="mt-1">
                                  <LuckScales score={indicator.score} size={150} />
                              </div>
                              <div className="text-xl font-black text-slate-900 mt-2">%{indicator.score}</div>
                          </div>
                      ) : indicator.label === 'Weekly' ? (`;

if (content.includes("indicator.label === 'Weekly'")) {
    content = content.replace(weeklySearch, monthlySubstitution);
}

fs.writeFileSync(filePath, content);
console.log("Successfully patched UserPage.tsx with LuckScales");
