// backup script - exports Firestore data to JSON
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
async function exportCollectionRecursive(docRef) {
  const doc = await docRef.get();
    const data = doc.exists ? doc.data() : null;
      const subcollections = await docRef.listCollections();
        const nested = {};
          for (const col of subcollections) {
              const snap = await col.get();
                  nested[col.id] = {};
                      for (const subDoc of snap.docs) {
                            nested[col.id][subDoc.id] = await exportCollectionRecursive(subDoc.ref);
                                }
                                  }
                                    return { data, subcollections: nested };
                                    }
                                    async function main() {
                                      console.log('starting backup');
                                        const usersSnap = await db.collection('users').get();
                                          const backup = { exportedAt: new Date().toISOString(), users: {} };
                                            for (const userDoc of usersSnap.docs) {
                                                backup.users[userDoc.id] = await exportCollectionRecursive(userDoc.ref);
                                                  }
                                                    const feedbackSnap = await db.collection('feedback').get();
                                                      backup.feedback = feedbackSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
                                                        const outDir = path.join(__dirname, '..', 'backups');
                                                          fs.mkdirSync(outDir, { recursive: true });
                                                            const filename = `backup-${new Date().toISOString().slice(0, 10)}.json`;
                                                              fs.writeFileSync(path.join(outDir, filename), JSON.stringify(backup, null, 2));
                                                                const files = fs.readdirSync(outDir).filter((f) => f.startsWith('backup-')).sort();
                                                                  while (files.length > 30) {
                                                                      fs.unlinkSync(path.join(outDir, files.shift()));
                                                                        }
                                                                          console.log('backup saved: ' + filename);
                                                                          }
                                                                          main().catch((err) => {
                                                                            console.error('backup failed:', err);
                                                                              process.exit(1);
                                                                              });
                                                                              
