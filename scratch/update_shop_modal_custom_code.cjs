const fs = require('fs');

const filePath = 'src/components/ShopModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add customCodeInput state
const stateMarker = 'const [createAmount, setCreateAmount] = useState<number>(50);';
if (!content.includes('customCodeInput')) {
    content = content.replace(stateMarker, `${stateMarker}\n  const [customCodeInput, setCustomCodeInput] = useState('');`);
}

// 2. Update handleCreateCoupon call
content = content.replace(
  'const code = await createCoupon(createAmount);',
  'const code = await createCoupon(createAmount, customCodeInput);'
);

// 3. Add reset for customCodeInput on success
content = content.replace(
  'setGeneratedCode(code);',
  'setGeneratedCode(code);\n      setCustomCodeInput(\'\');'
);

// 4. Update UI: Add Custom Code input field
const generateButtonRegex = /<button[\s\S]*?onClick=\{handleCreateCoupon\}[\s\S]*?>[\s\S]*?<\/button>/;
const customCodeField = `
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Custom Code (Optional)</label>
                        <div className="bg-slate-100 p-2 rounded-2xl border-2 border-transparent focus-within:border-purple-400 transition-all">
                          <input 
                            type="text" 
                            placeholder="e.g. MYCODE123"
                            value={customCodeInput}
                            onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            className="bg-transparent border-none focus:ring-0 text-center font-black text-slate-800 w-full text-xs uppercase"
                          />
                        </div>
                      </div>`;

// Insert the field before the Generate Code button
content = content.replace(generateButtonRegex, (match) => {
    return `${customCodeField}\n\n                      ${match}`;
});

fs.writeFileSync(filePath, content);
console.log('Successfully updated ShopModal.tsx with custom code UI');
