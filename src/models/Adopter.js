// 領養人類別
// 繼承自 User 類別

export class Adopter {
    constructor(userData) {
        this.userId = userData.userId || null;
        this.email = userData.email || '';
        this.name = userData.name || '';
        this.phone = userData.phone || '';
        this.status = userData.status || 'Active';
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
            const petData = await getPetById(applicationData.petId);
            if (!petData) {
                return {
                    success: false,
                    message: '寵物不存在'
                };
            }

            const pet = new Pet({ ...petData, petId: petData.id });

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

    // 轉換為 Firestore 格式
    toFirestore() {
        return {
            userId: this.userId,
            email: this.email,
            name: this.name,
            phone: this.phone,
            status: this.status
        };
    }

    // 從 Firestore 建立物件
    static fromFirestore(data) {
        return new Adopter(data);
    }
}

