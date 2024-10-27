import { FirebaseApp, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { FacebookAuthProvider, getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDic8ULiNQ8LTvEZYwHYkAnieuPADhvBz4",
  authDomain: "dsweet-55edb.firebaseapp.com",
  projectId: "dsweet-55edb",
  storageBucket: "dsweet-55edb.appspot.com",
  messagingSenderId: "623006273879",
  appId: "1:623006273879:web:d470c254021d6e0dcaae12",
  measurementId: "G-500Y86YE2M"
};

const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const facebookProvider = new FacebookAuthProvider();

