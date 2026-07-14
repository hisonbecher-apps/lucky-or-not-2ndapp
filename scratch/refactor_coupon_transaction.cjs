const fs = require('fs');

const filePath = 'src/context/AppContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add runTransaction to imports
if (!content.includes('runTransaction')) {
    content = content.replace(
      'import { doc, getDoc, setDoc, updateDoc } from \'firebase/firestore\';',
      'import { doc, getDoc, setDoc, updateDoc, runTransaction } from \'firebase/firestore\';'
    );
}

// 2. Refactor createCoupon logic
const createCouponStart = 'const createCoupon = async (amount: number, customCode?: string): Promise<string> => {';
const createCouponEnd = '  };'; // Match the end of the function

const newImpl = `const createCoupon = async (amount: number, customCode?: string): Promise<string> => {
    if (state.credits < amount) throw new Error('Insufficient credits');
    if (!state.user) throw new Error('Log in to create coupons');

    let code: string;
    
    // Generate code first (either custom or random)
    if (customCode && customCode.trim().length > 0) {
      code = customCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (code.length < 3) throw new Error('Code must be at least 3 characters');
    } else {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const generateSegment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      code = \`GIFT-\${generateSegment(4)}-\${generateSegment(4)}\`;
    }

    try {
      // Use Transaction for atomicity and automatic retries
      return await runTransaction(db, async (transaction) => {
        const couponRef = doc(db, 'coupons', code);
        const couponDoc = await transaction.get(couponRef);
        
        if (couponDoc.exists()) {
          throw new Error('This code is already taken');
        }

        transaction.set(couponRef, {
          amount,
          createdBy: auth.currentUser?.uid,
          createdAt: Date.now(),
          usedBy: null,
          usedAt: null
        });

        // Deduct credits locally only after transaction succeeds
        setState(prev => ({ ...prev, credits: prev.credits - amount }));
        return code;
      });
    } catch (err: any) {
      console.error("Create coupon error:", err);
      if (err.message.includes('offline')) {
        throw new Error('Network error: Browser is offline');
      }
      throw new Error(err.message || 'Failed to create coupon');
    }
  };`;

// Use a more robust replacement strategy for the whole function
const oldImplRegex = /const createCoupon = async \(amount: number, customCode\?: string\): Promise<string> => \{[\s\S]*?\};/;
content = content.replace(oldImplRegex, newImpl);

fs.writeFileSync(filePath, content);
console.log('Successfully refactored createCoupon to use runTransaction');
 Stone
