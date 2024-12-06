const admin = require('firebase-admin');
const { firebaseConfig } = require('../config/config');

const initializeFirebase = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      storageBucket: `gs://${firebaseConfig.project_id}.appspot.com`
    });
  }
};

module.exports = { initializeFirebase };
