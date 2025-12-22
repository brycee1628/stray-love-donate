// Firebase Storage 圖片上傳工具
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config.js';

// 上傳圖片
export async function uploadImage(file, path) {
    try {
        // 檢查文件類型
        if (!file.type.startsWith('image/')) {
            return {
                success: false,
                error: '檔案必須是圖片格式'
            };
        }

        // 檢查文件大小（限制 10MB）
        if (file.size > 10 * 1024 * 1024) {
            return {
                success: false,
                error: '圖片大小不能超過 10MB'
            };
        }

        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return {
            success: true,
            url: downloadURL,
            path: snapshot.ref.fullPath
        };
    } catch (error) {
        console.error('圖片上傳失敗:', error);
        return {
            success: false,
            error: error.message || '圖片上傳失敗'
        };
    }
}

// 上傳寵物照片
export async function uploadPetPhoto(file, petId, index) {
    const timestamp = Date.now();
    const fileName = `pets/${petId}/photo_${index}_${timestamp}.jpg`;
    return await uploadImage(file, fileName);
}
