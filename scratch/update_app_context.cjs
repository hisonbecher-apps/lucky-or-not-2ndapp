const fs = require('fs');
const path = require('path');

const filePath = 'src/context/AppContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Interface
const interfaceMarker = '  stopAllGameSounds: () => void;';
content = content.replace(interfaceMarker, `${interfaceMarker}\n  createCoupon: (amount: number) => Promise<string>;\n  redeemCoupon: (code: string) => Promise<number>;`);

// 2. Add Logic
const logicMarker = '  const stopAllGameSounds = () => soundService.stopAllGameSounds();';
const newLogic = `
  const createCoupon = async (amount: number): Promise<string> => {
    if (state.credits < amount) throw new Error('Insufficient credits');
    if (!state.user) throw new Error('Log in to create coupons');

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const generateSegment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const code = \`GIFT-\${generateSegment(4)}-\${generateSegment(4)}\`;

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
    } catch (err) {
      console.error("Create coupon error:", err);
      throw new Error('Failed to create coupon');
    }
  };

  const redeemCoupon = async (code: string): Promise<number> => {
    if (!state.user) throw new Error('Log in to redeem coupons');
    if (!code || code.trim() === '') throw new Error('Invalid code');

    try {
      const normalizedCode = code.trim().toUpperCase();
      const couponRef = doc(db, 'coupons', normalizedCode);
      const couponDoc = await getDoc(couponRef);

      if (!couponDoc.exists()) throw new Error('Coupon not found');
      
      const data = couponDoc.data();
      if (data.usedBy) throw new Error('Coupon already used');

      const amount = data.amount;
      await updateDoc(couponRef, {
        usedBy: auth.currentUser?.uid,
        usedAt: Date.now()
      });

      addCredits(amount, true);
      return amount;
    } catch (err: any) {
      console.error("Redeem coupon error:", err);
      throw new Error(err.message || 'Failed to redeem');
    }
  };
`;
content = content.replace(logicMarker, `${logicMarker}\n${newLogic}`);

// 3. Update Provider Value
const providerMarker = '      stopAllGameSounds,';
content = content.replace(providerMarker, `      stopAllGameSounds,\n      createCoupon,\n      redeemCoupon,`);

fs.writeFileSync(filePath, content);
console.log('Successfully updated AppContext.tsx');
