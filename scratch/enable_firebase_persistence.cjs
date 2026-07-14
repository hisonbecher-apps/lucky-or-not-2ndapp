const fs = require('fs');

const filePath = 'src/lib/firebase.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
content = content.replace(
  'import { getFirestore } from \'firebase/firestore\';',
  'import { getFirestore, enableMultiTabIndexedDbPersistence } from \'firebase/firestore\';'
);

// 2. Add persistence initialization
if (!content.includes('enableMultiTabIndexedDbPersistence')) {
    const initCode = `
// Enable local persistence
enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore persistence failed: Browser not supported');
    }
});
`;
    content = content.replace('export const db = getFirestore(app);', `export const db = getFirestore(app);\n${initCode}`);
}

fs.writeFileSync(filePath, content);
console.log('Successfully enabled Firestore persistence in firebase.ts');
