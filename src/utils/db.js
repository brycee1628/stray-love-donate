// Firestore 資料庫操作工具
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config.js';

// 測試資料庫連接
export async function testConnection() {
    try {
        // 嘗試讀取一個測試集合（如果不存在也沒關係，只是測試連接）
        const testCollection = collection(db, 'test');
        const snapshot = await getDocs(testCollection);
        return {
            success: true,
            message: '資料庫連接成功！',
            count: snapshot.size
        };
    } catch (error) {
        return {
            success: false,
            message: `資料庫連接失敗: ${error.message}`,
            error: error
        };
    }
}

// 寫入測試資料
export async function writeTestData() {
    try {
        const testCollection = collection(db, 'test');
        const docRef = await addDoc(testCollection, {
            message: '測試資料',
            timestamp: serverTimestamp(),
            createdAt: new Date().toISOString()
        });
        return {
            success: true,
            message: '資料寫入成功！',
            id: docRef.id
        };
    } catch (error) {
        return {
            success: false,
            message: `資料寫入失敗: ${error.message}`,
            error: error
        };
    }
}

