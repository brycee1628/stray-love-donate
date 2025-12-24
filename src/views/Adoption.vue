<template>
    <div class="adoption">
        <div class="container">
            <h1>領養申請</h1>
            <p class="subtitle">填寫領養申請書，讓送養人了解您</p>

            <!-- 寵物資訊顯示 -->
            <div v-if="petInfo" class="pet-info-card">
                <div class="pet-info-header">
                    <h2>{{ petInfo.name }}</h2>
                    <span class="pet-status" :class="getStatusClass(petInfo.status)">
                        {{ getStatusText(petInfo.status) }}
                    </span>
                </div>
                <div class="pet-info-details">
                    <p><strong>種類：</strong>{{ getSpeciesText(petInfo.species) }}</p>
                    <p v-if="petInfo.breed"><strong>品種：</strong>{{ petInfo.breed }}</p>
                    <p><strong>年齡：</strong>{{ petInfo.age }} 歲</p>
                    <p><strong>性別：</strong>{{ getGenderText(petInfo.gender) }}</p>
                    <p><strong>所在地：</strong>{{ petInfo.location }}</p>
                </div>
            </div>

            <form @submit.prevent="handleSubmit" class="adoption-form">
                <!-- 個人資訊 -->
                <section class="form-section">
                    <h2>個人資訊</h2>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="applicantName">姓名 <span class="required">*</span></label>
                            <input id="applicantName" v-model="formData.applicantName" type="text"
                                placeholder="請輸入您的真實姓名" required />
                        </div>

                        <div class="form-group">
                            <label for="phone">聯絡電話 <span class="required">*</span></label>
                            <input id="phone" v-model="formData.phone" type="tel" placeholder="例如：0912-345-678"
                                required />
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="email">電子郵件 <span class="required">*</span></label>
                        <input id="email" v-model="formData.email" type="email" placeholder="例如：example@email.com"
                            required />
                    </div>

                    <div class="form-group">
                        <label for="address">居住地址 <span class="required">*</span></label>
                        <input id="address" v-model="formData.address" type="text" placeholder="例如：台北市信義區信義路五段7號"
                            required />
                    </div>
                </section>

                <!-- 領養問卷 -->
                <section class="form-section">
                    <h2>領養問卷</h2>

                    <div class="form-group">
                        <label for="livingEnvironment">居住環境 <span class="required">*</span></label>
                        <select id="livingEnvironment" v-model="formData.livingEnvironment" required>
                            <option value="">請選擇</option>
                            <option value="house">獨棟房屋</option>
                            <option value="apartment">公寓</option>
                            <option value="condo">大樓</option>
                            <option value="other">其他</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="hasYard">是否有院子或戶外空間？</label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" v-model="formData.hasYard" value="yes" />
                                有
                            </label>
                            <label class="radio-label">
                                <input type="radio" v-model="formData.hasYard" value="no" />
                                沒有
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="experience">飼養經驗 <span class="required">*</span></label>
                        <textarea id="experience" v-model="formData.experience" rows="4" placeholder="請描述您過去的寵物飼養經驗..."
                            required></textarea>
                    </div>

                    <div class="form-group">
                        <label for="carePlan">照顧計畫 <span class="required">*</span></label>
                        <textarea id="carePlan" v-model="formData.carePlan" rows="5"
                            placeholder="請描述您對這隻寵物的照顧計畫，包括日常作息、飲食安排、醫療規劃等..." required></textarea>
                    </div>

                    <div class="form-group">
                        <label for="familyMembers">家庭成員</label>
                        <textarea id="familyMembers" v-model="formData.familyMembers" rows="3"
                            placeholder="請描述您的家庭成員（人數、年齡、是否同意領養等）"></textarea>
                    </div>
                </section>

                <!-- 個資同意 -->
                <section class="form-section">
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="formData.agreePrivacy" required />
                            <span>我已閱讀並同意<a href="#" @click.prevent>個資同意書</a>，同意提供個人資料用於領養申請審核 <span
                                    class="required">*</span></span>
                        </label>
                    </div>
                </section>

                <!-- 錯誤訊息 -->
                <div v-if="errors.length > 0" class="error-message">
                    <ul>
                        <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
                    </ul>
                </div>

                <!-- 成功訊息 -->
                <div v-if="successMessage" class="success-message">
                    {{ successMessage }}
                </div>

                <!-- 提交按鈕 -->
                <div class="form-actions">
                    <button type="submit" :disabled="submitting" class="btn-primary">
                        {{ submitting ? '提交中...' : '提交申請' }}
                    </button>
                    <button type="button" @click="goBack" class="btn-secondary">
                        返回
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Adopter } from '../models/Adopter.js';
import { isPetAvailable } from '../utils/adoption.js';
import { getPetById } from '../utils/pets.js';

const router = useRouter();
const route = useRoute();

// 寵物資訊
const petInfo = ref(null);
const loadingPet = ref(true);

// 表單資料
const formData = reactive({
    applicantName: '',
    phone: '',
    email: '',
    address: '',
    livingEnvironment: '',
    hasYard: '',
    experience: '',
    carePlan: '',
    familyMembers: '',
    agreePrivacy: false
});

// 狀態
const errors = ref([]);
const successMessage = ref('');
const submitting = ref(false);

// 載入寵物資訊
async function loadPetInfo() {
    const petId = route.params.id;
    if (!petId) {
        errors.value.push('缺少寵物 ID');
        loadingPet.value = false;
        return;
    }

    try {
        const petResult = await getPetById(petId);
        if (petResult.success && petResult.pet) {
            petInfo.value = { id: petResult.pet.id, ...petResult.pet };

            // 檢查寵物是否可申請
            const availability = await isPetAvailable(petId);
            if (!availability.available) {
                errors.value.push(availability.message);
            }
        } else {
            errors.value.push('找不到該寵物資訊');
        }
    } catch (error) {
        console.error('載入寵物資訊失敗:', error);
        errors.value.push('載入寵物資訊失敗');
    } finally {
        loadingPet.value = false;
    }
}

// 驗證表單
function validateForm() {
    errors.value = [];

    if (!formData.applicantName.trim()) {
        errors.value.push('請輸入姓名');
    }

    if (!formData.phone.trim()) {
        errors.value.push('請輸入聯絡電話');
    }

    if (!formData.email.trim()) {
        errors.value.push('請輸入電子郵件');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.value.push('請輸入有效的電子郵件格式');
    }

    if (!formData.address.trim()) {
        errors.value.push('請輸入居住地址');
    }

    if (!formData.livingEnvironment) {
        errors.value.push('請選擇居住環境');
    }

    if (!formData.experience.trim()) {
        errors.value.push('請填寫飼養經驗');
    }

    if (!formData.carePlan.trim()) {
        errors.value.push('請填寫照顧計畫');
    }

    if (!formData.agreePrivacy) {
        errors.value.push('請同意個資同意書');
    }

    return errors.value.length === 0;
}

// 提交表單
async function handleSubmit() {
    errors.value = [];
    successMessage.value = '';

    if (!validateForm()) {
        return;
    }

    if (!petInfo.value) {
        errors.value.push('寵物資訊載入失敗，無法提交申請');
        return;
    }

    submitting.value = true;

    try {
        // 建立 Adopter 物件（暫時使用臨時資料，等登入功能完成後再改）
        const adopter = new Adopter({
            userId: null, // 暫時設為 null，等登入功能完成後再改
            email: formData.email.trim(),
            name: formData.applicantName.trim(),
            phone: formData.phone.trim()
        });

        // 呼叫 Adopter 物件的 submitApplication() 方法（UC-05）
        // 根據序列圖 4.5：參與者呼叫 Adopter 物件的 submitApplication() 方法
        const result = await adopter.submitApplication({
            petId: petInfo.value.id,
            applicantName: formData.applicantName.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            address: formData.address.trim(),
            livingEnvironment: formData.livingEnvironment,
            hasYard: formData.hasYard || null,
            experience: formData.experience.trim(),
            carePlan: formData.carePlan.trim(),
            familyMembers: formData.familyMembers.trim() || null,
            agreePrivacy: formData.agreePrivacy
        });

        if (result.success) {
            successMessage.value = result.message;
            // 1 秒後跳轉回首頁
            setTimeout(() => {
                router.push('/');
            }, 1000);
        } else {
            errors.value.push(result.message);
        }
    } catch (error) {
        console.error('提交申請失敗:', error);
        errors.value.push(`提交失敗: ${error.message}`);
    } finally {
        submitting.value = false;
    }
}

// 返回
function goBack() {
    router.back();
}

// 取得種類文字
function getSpeciesText(species) {
    const map = { dog: '狗', cat: '貓', other: '其他' };
    return map[species] || species;
}

// 取得性別文字
function getGenderText(gender) {
    const map = { male: '公', female: '母', unknown: '未知' };
    return map[gender] || gender;
}

// 取得狀態文字
function getStatusText(status) {
    const map = {
        PendingReview: '待審核',
        Available: '待領養',
        Adopted: '已領養',
        Rejected: '已拒絕'
    };
    return map[status] || status;
}

// 取得狀態樣式類別
function getStatusClass(status) {
    const map = {
        PendingReview: 'status-pending',
        Available: 'status-available',
        Adopted: 'status-adopted',
        Rejected: 'status-rejected'
    };
    return map[status] || '';
}

onMounted(() => {
    loadPetInfo();
});
</script>

<style scoped>
.adoption {
    min-height: 100vh;
    background: #f9fafb;
    padding: 40px 20px;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

h1 {
    font-size: 2rem;
    color: #111827;
    margin: 0 0 8px;
    text-align: center;
}

.subtitle {
    text-align: center;
    color: #6b7280;
    margin: 0 0 32px;
}

.pet-info-card {
    background: #f3f4f6;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 32px;
    border: 1px solid #e5e7eb;
}

.pet-info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.pet-info-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #111827;
}

.pet-status {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 500;
}

.status-available {
    background: #dcfce7;
    color: #166534;
}

.status-pending {
    background: #fef3c7;
    color: #92400e;
}

.status-adopted {
    background: #dbeafe;
    color: #1e40af;
}

.status-rejected {
    background: #fee2e2;
    color: #991b1b;
}

.pet-info-details p {
    margin: 8px 0;
    color: #4b5563;
}

.adoption-form {
    display: flex;
    flex-direction: column;
    gap: 32px;
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-section h2 {
    font-size: 1.25rem;
    color: #111827;
    margin: 0 0 8px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e5e7eb;
}

.form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

label {
    font-weight: 500;
    color: #374151;
    font-size: 0.9rem;
}

.required {
    color: #ef4444;
}

input[type="text"],
input[type="tel"],
input[type="email"],
select,
textarea {
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
}

input:focus,
select:focus,
textarea:focus {
    outline: none;
    border-color: #16a085;
    box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.1);
}

textarea {
    resize: vertical;
    font-family: inherit;
}

.radio-group {
    display: flex;
    gap: 16px;
}

.radio-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-weight: normal;
}

.radio-label input[type="radio"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    cursor: pointer;
    font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin-top: 2px;
    cursor: pointer;
    flex-shrink: 0;
}

.checkbox-label a {
    color: #16a085;
    text-decoration: underline;
}

.error-message {
    background: #fee2e2;
    color: #991b1b;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #fca5a5;
}

.error-message ul {
    margin: 0;
    padding-left: 20px;
}

.success-message {
    background: #dcfce7;
    color: #166534;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #86efac;
}

.form-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    padding-top: 8px;
}

.btn-primary,
.btn-secondary {
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
}

.btn-primary {
    background: #16a085;
    color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
    background: #13866f;
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-secondary {
    background: #f3f4f6;
    color: #374151;
}

.btn-secondary:hover {
    background: #e5e7eb;
}

@media (max-width: 640px) {
    .container {
        padding: 24px 16px;
    }

    .form-row {
        grid-template-columns: 1fr;
    }

    .form-actions {
        flex-direction: column;
    }

    .btn-primary,
    .btn-secondary {
        width: 100%;
    }
}
</style>
