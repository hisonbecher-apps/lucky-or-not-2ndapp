const fs = require('fs');

const filePath = 'src/context/AppContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldLine = 'const normalizedCode = code.trim().toUpperCase();';
const newLine = `const normalizedCode = code.trim().toUpperCase();
      
      // Special Permanent Promo Code
      if (normalizedCode === 'HB5376') {
        addCredits(100, true);
        return 100;
      }`;

if (!content.includes("'HB5376'")) {
    content = content.replace(oldLine, newLine);
    fs.writeFileSync(filePath, content);
    console.log('Successfully added permanent promo code HB5376');
} else {
    console.log('Promo code HB5376 already exists');
}
