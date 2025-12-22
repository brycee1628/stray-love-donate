// Firebase 配置和初始化
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './firebase-config.js';

// 初始化 Firebase 應用程式
const app = initializeApp(firebaseConfig);

// 初始化 Firestore 資料庫
const db = getFirestore(app);

// 初始化 Storage
const storage = getStorage(app);

// 匯出實例
export { db, storage };

