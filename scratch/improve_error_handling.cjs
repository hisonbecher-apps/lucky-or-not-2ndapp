const fs = require('fs');

const filePath = 'src/components/ShopModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add setRedeemCode and setCustomCodeInput reset on tab switch (optional but good)
// All good there.

// 2. Refine error handling in handleCreateCoupon
content = content.replace(
  'setMessage({ text: err.message || \'An error occurred\', type: \'error\' });',
  'const errorMsg = err.message.includes(\'offline\') ? \'Network Error: Please check your connection\' : (err.message || \'An error occurred\');\n      setMessage({ text: errorMsg, type: \'error\' });'
);

// 3. (Optional) Auto-retry once logic
// I'll skip auto-retry for now as transactions already do some retrying.

fs.writeFileSync(filePath, content);
console.log('Successfully updated ShopModal.tsx error handling');
极
