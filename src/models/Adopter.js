// 領養人類別
// 繼承自 User 類別

import { User } from './User.js';

export class Adopter extends User {
    constructor(userData) {
        super(userData);
        // Adopter 特有的屬性可以在這裡添加
    }

    // 提交領養申請（UC-05）
    // 根據序列圖 4.5：參與者呼叫 Adopter 物件的 submitApplication() 方法
    async submitApplication(applicationData) {
        try {
            // 先檢查寵物是否可申請（防止 Race Condition）
            // 根據序列圖 4.5：先呼叫 Pet 的 isAvailable() 方法
            const { getPetById } = await import('../utils/pets.js');
            const { Pet } = await import('./Pet.js');

            // 取得寵物資料並建立 Pet 物件
            const petDataResult = await getPetById(applicationData.petId);
            if (!petDataResult.success || !petDataResult.pet) {
                return {
                    success: false,
                    message: petDataResult.message || '寵物不存在'
                };
            }

            const pet = new Pet({ ...petDataResult.pet, petId: petDataResult.pet.id });

            // 呼叫 Pet 的 isAvailable() 方法
            const availabilityCheck = await pet.isAvailable();

            if (!availabilityCheck.available) {
                return {
                    success: false,
                    message: availabilityCheck.message
                };
            }

            // 建立 AdoptionApplication 物件
            // 根據序列圖 4.5：建立 AdoptionApplication 物件，狀態設為 Pending
            const { AdoptionApplication } = await import('./AdoptionApplication.js');
            const application = new AdoptionApplication({
                ...applicationData,
                adopterId: this.userId,
                status: 'Pending' // 待審核
            });

            // 建立申請記錄
            // 根據序列圖 4.5：呼叫 AdoptionApplication 的 create() 方法
            const result = await application.create();

            return result;
        } catch (error) {
            console.error('提交領養申請失敗:', error);
            return {
                success: false,
                message: `提交失敗: ${error.message}`,
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
        return new Adopter(data);
    }
}

