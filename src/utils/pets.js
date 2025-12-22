// 寵物資料操作工具
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../firebase/config.js';

// 寵物集合
const petsCollection = collection(db, 'pets');
const petPhotosCollection = collection(db, 'petPhotos');

// 建立寵物資料
export async function createPet(petData) {
    try {
        const docRef = await addDoc(petsCollection, {
            ...petData,
            status: 'PendingReview', // 待審核
            createTime: serverTimestamp(),
            updateTime: serverTimestamp()
        });
        return {
            success: true,
            id: docRef.id,
            message: '寵物資料建立成功！'
        };
    } catch (error) {
        console.error('建立寵物資料失敗:', error);
        return {
            success: false,
            message: `建立失敗: ${error.message}`,
            error: error
        };
    }
}

// 建立寵物照片記錄
export async function createPetPhoto(photoData) {
    try {
        const docRef = await addDoc(petPhotosCollection, {
            ...photoData,
            createTime: serverTimestamp()
        });
        return {
            success: true,
            id: docRef.id
        };
    } catch (error) {
        console.error('建立照片記錄失敗:', error);
        return {
            success: false,
            message: `建立照片記錄失敗: ${error.message}`,
            error: error
        };
    }
}

// 取得所有寵物（用於首頁顯示）
export async function getAllPets(limitCount = 10) {
    try {
        // 先嘗試使用 orderBy，如果失敗則在客戶端排序
        let querySnapshot;
        try {
            const q = query(
                petsCollection,
                orderBy('createTime', 'desc'),
                limit(limitCount)
            );
            querySnapshot = await getDocs(q);
        } catch (orderByError) {
            // 如果 orderBy 失敗（可能是因為沒有索引），則取得所有資料並在客戶端排序
            console.warn('使用 orderBy 失敗，改為客戶端排序:', orderByError);
            querySnapshot = await getDocs(petsCollection);
        }

        let pets = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 如果沒有使用 orderBy，則在客戶端排序
        if (pets.length > 0 && pets[0].createTime) {
            pets.sort((a, b) => {
                const timeA = a.createTime?.toMillis ? a.createTime.toMillis() : (a.createTime?.seconds || 0) * 1000;
                const timeB = b.createTime?.toMillis ? b.createTime.toMillis() : (b.createTime?.seconds || 0) * 1000;
                return timeB - timeA; // 降序
            });
        }

        // 限制數量
        pets = pets.slice(0, limitCount);

        return {
            success: true,
            pets: pets
        };
    } catch (error) {
        console.error('取得寵物列表失敗:', error);
        return {
            success: false,
            message: `取得寵物列表失敗: ${error.message}`,
            error: error
        };
    }
}

// 根據寵物 ID 取得照片
export async function getPetPhotos(petId) {
    try {
        // 先取得所有照片，然後在客戶端過濾和排序（避免需要建立索引）
        const querySnapshot = await getDocs(petPhotosCollection);
        const photos = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(photo => photo.petId === petId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        return {
            success: true,
            photos: photos
        };
    } catch (error) {
        console.error('取得寵物照片失敗:', error);
        return {
            success: false,
            message: `取得寵物照片失敗: ${error.message}`,
            error: error
        };
    }
}

