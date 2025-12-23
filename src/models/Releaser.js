// 送養人類別
// 繼承自 User 類別

import { User } from './User.js';

export class Releaser extends User {
    constructor(userData) {
        super(userData);
        // Releaser 特有的屬性可以在這裡添加
    }

    // 上傳寵物資訊（UC-02）
    // 根據序列圖 4.2：參與者呼叫 Releaser 物件的 uploadPet() 方法傳入資料
    async uploadPet(petData, photoFiles) {
        try {
            // 1. 建立一個新的 Pet 物件
            const { Pet } = await import('./Pet.js');
            const pet = new Pet({
                ...petData,
                releaserId: this.userId,
                status: 'PendingReview' // 待審核
            });

            // 2. 透過 save() 方法將其狀態初始化為 PendingReview
            const saveResult = await pet.save();

            if (!saveResult.success) {
                return {
                    success: false,
                    message: saveResult.message
                };
            }

            const petId = saveResult.id;

            // 3. 進入迴圈，針對每一張上傳的圖片，呼叫 PetPhoto 物件的 upload() 方法
            const { PetPhoto } = await import('./PetPhoto.js');
            const photoUploadResults = [];

            for (let i = 0; i < photoFiles.length; i++) {
                const photoFile = photoFiles[i];
                try {
                    const petPhoto = new PetPhoto({
                        petId: petId,
                        order: i
                    });

                    const uploadResult = await petPhoto.upload(photoFile);

                    if (uploadResult.success) {
                        photoUploadResults.push({ success: true, index: i });
                    } else {
                        photoUploadResults.push({ success: false, index: i, error: uploadResult.message });
                    }
                } catch (error) {
                    console.error(`照片 ${i + 1} 上傳失敗:`, error);
                    photoUploadResults.push({ success: false, index: i, error: error.message });
                }
            }

            // 4. 所有資料建立完成後，回傳上架成功訊息
            const successCount = photoUploadResults.filter(r => r.success).length;
            const failCount = photoUploadResults.filter(r => !r.success).length;

            if (successCount > 0) {
                return {
                    success: true,
                    petId: petId,
                    message: `寵物資料已成功提交！已上傳 ${successCount} 張照片。${failCount > 0 ? `（${failCount} 張照片上傳失敗）` : ''}`,
                    photoResults: photoUploadResults
                };
            } else if (failCount > 0) {
                return {
                    success: false,
                    message: '寵物資料已建立，但所有照片上傳失敗。請檢查 Firebase Storage 設置。',
                    photoResults: photoUploadResults
                };
            } else {
                return {
                    success: true,
                    petId: petId,
                    message: '寵物資料已成功提交！',
                    photoResults: photoUploadResults
                };
            }
        } catch (error) {
            console.error('上傳寵物資訊失敗:', error);
            return {
                success: false,
                message: `上傳失敗: ${error.message}`,
                error: error
            };
        }
    }

    // 轉換為 Firestore 格式（繼承自 User）
    toFirestore() {
        return super.toFirestore();
    }

    // 從 Firestore 建立物件
    static fromFirestore(data) {
        return new Releaser(data);
    }
}

