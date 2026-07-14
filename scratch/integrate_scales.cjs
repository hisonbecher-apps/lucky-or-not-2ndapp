const fs = require('fs');

const filePath = 'src/pages/UserPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("import LuckScales")) {
    content = content.replace(
        "import LuckHorseshoe from '../components/LuckHorseshoe';",
        "import LuckHorseshoe from '../components/LuckHorseshoe';\nimport LuckScales from '../components/LuckScales';"
    );
}

// 2. Inject LuckScales into the Monthly block
// We look for the indicator loop and check for label === 'Monthly'
const monthlyBlock = `{indicator.label === 'Monthly' ? (
                          <div className="flex flex-col items-center justify-center h-full">
                              <LuckScales score={indicator.score} size={160} />
                              <div className="text-xl font-black text-slate-900 mt-2">%{indicator.score}</div>
                          </div>
                      ) : (`;

// The current logic handles indicators generically. I'll split it for Monthly/Yearly.
const oldLogic = `{indicator.label === 'Monthly' || indicator.label === 'Yearly' ? (
                                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">
                                  Performance
                                </p>
                              ) : null}`;

// I'll refactor the indicator rendering block to handle 'Monthly' specifically with LuckScales
if (content.includes("indicator.label === 'Monthly'")) {
    // If I already have some Monthly specific logic, I'll replace it
} else {
    // The current loop is generic for Daily/Monthly/Yearly (except Weekly which has Horseshoe)
    // I will insert the Monthly logic before the progress bar
    const progressBlockSearch = "div className=\"w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden\"";
    
    // Better yet, I'll find the ternary for Weekly and add a condition for Monthly
    const weeklyCheck = "indicator.label === 'Weekly' ? (";
    const monthlyInject = `indicator.label === 'Monthly' ? (
                          <div className="flex flex-col items-center justify-center h-full">
                              <div className="mt-1">
                                  <LuckScales score={indicator.score} size={150} />
                              </div>
                              <div className="text-xl font-black text-slate-900 mt-2">%{indicator.score}</div>
                          </div>
                      ) : indicator.label === 'Weekly' ? (`;
    
    content = content.replace(weeklyCheck, monthlyInject);
}

fs.writeFileSync(filePath, content);
console.log("Successfully integrated LuckScales into UserPage.tsx");
极
