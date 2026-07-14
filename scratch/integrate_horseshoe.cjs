const fs = require('fs');

const filePath = 'src/pages/UserPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("import LuckHorseshoe")) {
    content = content.replace(
        "import SevenLeafClover, { DayLuckStatus } from '../components/SevenLeafClover';",
        "import SevenLeafClover, { DayLuckStatus } from '../components/SevenLeafClover';\nimport LuckHorseshoe from '../components/LuckHorseshoe';"
    );
}

// 2. Replace component logic
const oldFragment = `{indicator.label === 'Weekly' ? (
                          <div className="flex flex-col items-center justify-center h-full">
                              <div className="scale-50 origin-center -my-8">
                                  <SevenLeafClover days={getWeeklyCloverData()} size={180} />
                              </div>
                              <div className="text-xl font-black text-slate-900">%{indicator.score}</div>
                          </div>
                      ) : (`;

const newFragment = `{indicator.label === 'Weekly' ? (
                          <div className="flex flex-col items-center justify-center h-full -mt-2">
                              <div className="scale-[0.55] origin-center -my-12">
                                  <LuckHorseshoe days={getWeeklyCloverData()} size={280} />
                              </div>
                              <div className="text-xl font-black text-slate-900 mt-2">%{indicator.score}</div>
                          </div>
                      ) : (`;

// Using a more lenient replace if needed, but let's try direct first
if (content.includes("SevenLeafClover days={getWeeklyCloverData()}")) {
    content = content.replace(oldFragment, newFragment);
} else {
    // Fallback if formatting differs
    content = content.replace(
        /<SevenLeafClover\s+days=\{getWeeklyCloverData\(\)\}\s+size=\{180\}\s+\/>/,
        "<LuckHorseshoe days={getWeeklyCloverData()} size={280} />"
    );
}

fs.writeFileSync(filePath, content);
console.log("Successfully integrated LuckHorseshoe into UserPage.tsx");
极
