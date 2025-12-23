// 領養申請類別

export class AdoptionApplication {
    constructor(applicationData) {
        this.applicationId = applicationData.applicationId || null;
        this.petId = applicationData.petId || null;
        this.adopterId = applicationData.adopterId || null;
        this.applicantName = applicationData.applicantName || '';
        this.phone = applicationData.phone || '';
        this.email = applicationData.email || '';
        this.address = applicationData.address || '';
        this.livingEnvironment = applicationData.livingEnvironment || '';
        this.hasYard = applicationData.hasYard || null;
        this.experience = applicationData.experience || '';
        this.carePlan = applicationData.carePlan || '';
        this.familyMembers = applicationData.familyMembers || null;
        this.agreePrivacy = applicationData.agreePrivacy || false;
        this.status = applicationData.status || 'Pending';
        this.createTime = applicationData.createTime || null;
        this.updateTime = applicationData.updateTime || null;
    }

    // 建立申請記錄（UC-05）
    async create() {
        try {
            const { createAdoptionApplication } = await import('../utils/adoption.js');

            const result = await createAdoptionApplication(this.toFirestore());

            if (result.success) {
                this.applicationId = result.id;
                this.status = 'Pending';
            }

            return result;
        } catch (error) {
            console.error('建立申請記錄失敗:', error);
            return {
                success: false,
                message: `建立失敗: ${error.message}`,
                error: error
            };
        }
    }

    // 轉換為 Firestore 格式
    toFirestore() {
        return {
            petId: this.petId,
            adopterId: this.adopterId,
            applicantName: this.applicantName,
            phone: this.phone,
            email: this.email,
            address: this.address,
            livingEnvironment: this.livingEnvironment,
            hasYard: this.hasYard,
            experience: this.experience,
            carePlan: this.carePlan,
            familyMembers: this.familyMembers,
            agreePrivacy: this.agreePrivacy,
            status: this.status
        };
    }

    // 從 Firestore 建立物件
    static fromFirestore(data) {
        return new AdoptionApplication(data);
    }
}

