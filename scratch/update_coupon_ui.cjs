const fs = require('fs');

const filePath = 'src/components/ShopModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Translation: Turkish to English
content = content.replace(/Hediye Kullan/g, 'Redeem Coupon');
content = content.replace(/Kupon kodunu buraya yazın.../g, 'Enter coupon code here...');
content = content.replace(/Kodu Kullan/g, 'Redeem Code');
content = content.replace(/Hediye Oluştur/g, 'Create Gift');
content = content.replace(/Mevcut:/g, 'Balance:');
content = content.replace(/Kod Oluştur/g, 'Generate Code');
content = content.replace(/Kupon başarıyla oluşturuldu!/g, 'Coupon created successfully!');
content = content.replace(/Kod kopyalandı!/g, 'Code copied!');
content = content.replace(/kredi başarıyla eklendi!/g, 'credits added successfully!');
content = content.replace(/Geçersiz kod/g, 'Invalid code');
content = content.replace(/Hata oluştu/g, 'An error occurred');
content = content.replace(/Paylaşmaya Hazır!/g, 'Ready to share!');

// 2. Input UI Change: Slider to Number Input
const sliderBlockRegex = /<div className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl">[\s\S]*?<input[\s\S]*?type="range"[\s\S]*?\/>[\s\S]*?<span[\s\S]*?>[\s\S]*?<\/span>[\s\S]*?<\/div>/;
const newInputBlock = `
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Amount to Gift</label>
                        <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border-2 border-transparent focus-within:border-amber-400 transition-all">
                          <input 
                            type="number" 
                            min="10" 
                            max={credits}
                            step="10"
                            value={createAmount}
                            onChange={(e) => setCreateAmount(Math.min(credits, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="bg-transparent border-none focus:ring-0 text-center font-black text-slate-800 flex-grow"
                          />
                          <span className="text-xs">🍀</span>
                        </div>
                      </div>`;

content = content.replace(sliderBlockRegex, newInputBlock);

fs.writeFileSync(filePath, content);
console.log('Successfully localized and updated Coupon UI');
