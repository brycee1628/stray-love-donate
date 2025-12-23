// 寵物類別

export class Pet {
    constructor(petData) {
        this.petId = petData.petId || null;
        this.name = petData.name || '';
        this.species = petData.species || '';
        this.breed = petData.breed || null;
        this.age = petData.age || null;
        this.gender = petData.gender || '';
        this.location = petData.location || '';
        this.description = petData.description || '';
        this.isVaccinated = petData.isVaccinated || false;
        this.isNeutered = petData.isNeutered || false;
        this.isHealthy = petData.isHealthy || false;
        this.releaserId = petData.releaserId || null;
        this.status = petData.status || 'PendingReview';
        this.createTime = petData.createTime || null;
        this.updateTime = petData.updateTime || null;
    }

    // 檢查寵物是否可申請（UC-05）
    // 根據序列圖 4.5：Adopter 呼叫 Pet 的 isAvailable() 方法
    async isAvailable() {
        try {
            // 檢查寵物狀態是否為 Available（待領養）
            if (this.status !== 'Available') {
                return {
                    available: false,
                    message: `寵物目前狀態為：${this.status}，無法申請領養`
                };
            }

            return {
                available: true,
                petData: this
            };
        } catch (error) {
            console.error('檢查寵物狀態失敗:', error);
            return {
                available: false,
                message: `檢查失敗: ${error.message}`
            };
        }
    }

    // 儲存寵物資料（UC-02）
    // 根據序列圖 4.2：Releaser 透過 save() 方法將其狀態初始化為 PendingReview
    async save() {
        try {
            const { createPet } = await import('../utils/pets.js');

            const result = await createPet(this.toFirestore());

            if (result.success) {
                this.petId = result.id;
            }

            return result;
        } catch (error) {
            console.error('儲存寵物資料失敗:', error);
            return {
                success: false,
                message: `儲存失敗: ${error.message}`,
                error: error
            };
        }
    }

    // 轉換為 Firestore 格式
    toFirestore() {
        return {
            name: this.name,
            species: this.species,
            breed: this.breed,
            age: this.age,
            gender: this.gender,
            location: this.location,
            description: this.description,
            isVaccinated: this.isVaccinated,
            isNeutered: this.isNeutered,
            isHealthy: this.isHealthy,
            releaserId: this.releaserId,
            status: this.status
        };
    }

    // 從 Firestore 建立物件
    static fromFirestore(data) {
        return new Pet(data);
    }
}

