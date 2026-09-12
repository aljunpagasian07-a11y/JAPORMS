/* ==========================================
   JAPORMS — Firebase initialization
   Load this BEFORE any page-specific script
   (login.js, signup.js, etc). Requires the
   Firestore CDN script tag too, since this
   file calls firebase.firestore() below.
   ========================================== */

const firebaseConfig = {
  apiKey: "AIzaSyD94E4NBrFNB1gDC1p57Owhx9DhtXwfvaw",
  authDomain: "japorms-30969.firebaseapp.com",
  projectId: "japorms-30969",
  storageBucket: "japorms-30969.firebasestorage.app",
  messagingSenderId: "532123896227",
  appId: "1:532123896227:web:db00bfcadc96e6dfc27216"
};

firebase.initializeApp(firebaseConfig);

// Shared across login.js / signup.js
const auth = firebase.auth();
const db = firebase.firestore();
