// 寵物照片類別

export class PetPhoto {
    constructor(photoData) {
        this.photoId = photoData.photoId || null;
        this.petId = photoData.petId || null;
        this.photoUrl = photoData.photoUrl || null;
        this.photoPath = photoData.photoPath || null;
        this.order = photoData.order || 0;
        this.createTime = photoData.createTime || null;
    }

    // 上傳照片（UC-02）
    // 根據序列圖 4.2：針對每一張上傳的圖片，呼叫 PetPhoto 物件的 upload() 方法建立關聯資料
    async upload(photoFile) {
        try {
            if (!this.petId) {
                return {
                    success: false,
                    message: '缺少寵物 ID'
                };
            }

            // 上傳到 Storage
            const { uploadPetPhoto } = await import('../utils/storage.js');
            const uploadResult = await uploadPetPhoto(photoFile, this.petId, this.order);

            if (!uploadResult.success) {
                return {
                    success: false,
                    message: uploadResult.error || '照片上傳失敗'
                };
            }

            // 更新照片資訊
            this.photoUrl = uploadResult.url;
            this.photoPath = uploadResult.path;

            // 建立照片記錄
            const { createPetPhoto } = await import('../utils/pets.js');
            const photoRecordResult = await createPetPhoto({
                petId: this.petId,
                photoUrl: this.photoUrl,
                photoPath: this.photoPath,
                order: this.order
            });

            if (photoRecordResult.success) {
                this.photoId = photoRecordResult.id;
                return {
                    success: true,
                    message: '照片上傳成功'
                };
            } else {
                return {
                    success: false,
                    message: photoRecordResult.message || '建立照片記錄失敗'
                };
            }
        } catch (error) {
            console.error('上傳照片失敗:', error);
            return {
                success: false,
                message: `上傳失敗: ${error.message}`,
                error: error
            };
        }
    }

    // 轉換為 Firestore 格式
    toFirestore() {
        return {
            petId: this.petId,
            photoUrl: this.photoUrl,
            photoPath: this.photoPath,
            order: this.order
        };
    }

    // 從 Firestore 建立物件
    static fromFirestore(data) {
        return new PetPhoto(data);
    }
}

