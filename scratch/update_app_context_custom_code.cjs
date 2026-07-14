const fs = require('fs');

const filePath = 'src/context/AppContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Interface
content = content.replace(
  'createCoupon: (amount: number) => Promise<string>;',
  'createCoupon: (amount: number, customCode?: string) => Promise<string>;'
);

// 2. Update Implementation
const oldImplRegex = /const createCoupon = async \(amount: number\): Promise<string> => \{[\s\S]*?\};/;
const newImpl = `const createCoupon = async (amount: number, customCode?: string): Promise<string> => {
    if (state.credits < amount) throw new Error('Insufficient credits');
    if (!state.user) throw new Error('Log in to create coupons');

    let code: string;
    
    if (customCode && customCode.trim().length > 0) {
      code = customCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (code.length < 3) throw new Error('Code must be at least 3 characters');
      
      // Check if code exists
      const couponRef = doc(db, 'coupons', code);
      const couponDoc = await getDoc(couponRef);
      if (couponDoc.exists()) throw new Error('This code is already taken');
    } else {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const generateSegment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      code = \`GIFT-\${generateSegment(4)}-\${generateSegment(4)}\`;
    }

    try {
      const couponRef = doc(db, 'coupons', code);
      await setDoc(couponRef, {
        amount,
        createdBy: auth.currentUser?.uid,
        createdAt: Date.now(),
        usedBy: null,
        usedAt: null
      });

      setState(prev => ({ ...prev, credits: prev.credits - amount }));
      return code;
    } catch (err: any) {
      console.error("Create coupon error:", err);
      throw new Error(err.message || 'Failed to create coupon');
    }
  };`;

content = content.replace(oldImplRegex, newImpl);

fs.writeFileSync(filePath, content);
console.log('Successfully updated AppContext.tsx with custom code support');
