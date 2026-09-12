// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD94E4NBrFNB1gDC1p57Owhx9DhtXwfvaw",
  authDomain: "japorms-30969.firebaseapp.com",
  projectId: "japorms-30969",
  storageBucket: "japorms-30969.firebasestorage.app",
  messagingSenderId: "532123896227",
  appId: "1:532123896227:web:db00bfcadc96e6dfc27216",
  measurementId: "G-S77V5243DV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);