const fs = require('fs');

const filePath = 'src/components/ShopModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Effect for tab reset
const stateMarker = 'const [message, setMessage] = useState<{ text: string, type: \'success\' | \'error\' } | null>(null);';
const effectCode = `
  // Reset to shop tab when opening
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab('shop');
      setMessage(null);
      setGeneratedCode(null);
    }
  }, [isOpen]);`;

if (!content.includes('// Reset to shop tab')) {
    content = content.replace(stateMarker, `${stateMarker}\n${effectCode}`);
}

// 2. Reduce Spacing
content = content.replace(/p-6 text-center/g, 'p-4 text-center');
content = content.replace(/top-6 right-6/g, 'top-4 right-4');
content = content.replace(/mb-4/g, 'mb-2');
content = content.replace(/p-6 overflow-y-auto no-scrollbar space-y-6/g, 'p-4 overflow-y-auto no-scrollbar space-y-3');
content = content.replace(/gap-3/g, 'gap-2');
content = content.replace(/p-4 rounded-2xl border-2/g, 'p-3 rounded-2xl border-2');
content = content.replace(/w-10 h-10/g, 'w-8 h-8');
content = content.replace(/size=\{24\}/g, 'size={20}');
content = content.replace(/px-4 py-2 rounded-xl/g, 'px-3 py-1.5 rounded-xl');
content = content.replace(/p-6 bg-white border-t border-slate-100/g, 'p-3 bg-white border-t border-slate-100');

fs.writeFileSync(filePath, content);
console.log('Successfully optimized ShopModal layout');
