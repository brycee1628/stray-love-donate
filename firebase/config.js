// Firebase 配置和初始化
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase 配置資訊
const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID
};

// 初始化 Firebase 應用程式
const app = initializeApp(firebaseConfig);

// 初始化 Firestore 資料庫
const db = getFirestore(app);

// 初始化 Storage
const storage = getStorage(app);

// 匯出實例
export { db, storage };

