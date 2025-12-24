<template>
    <div class="pet-review-page">
        <div class="admin-container">
            <div class="page-header">
                <h1>刊登審核</h1>
                <router-link to="/admin" class="btn-back">← 返回後台首頁</router-link>
            </div>
            <div class="admin-content">
                <div class="pending-pets-section">
                    <h2>待審核寵物</h2>
                    <p class="section-description">管理待審核的寵物上架申請</p>

                    <div v-if="loadingPets" class="loading-message">載入中...</div>
                    <div v-else-if="errorPets" class="error-message">{{ errorPets }}</div>
                    <div v-else-if="pendingPets.length === 0" class="empty-message">目前沒有待審核的寵物</div>
                    <div v-else class="pets-list">
                        <div v-for="pet in pendingPets" :key="pet.id" class="pet-card">
                            <div class="pet-image">
                                <img v-if="pet.mainPhoto" :src="pet.mainPhoto" :alt="pet.name" />
                                <div v-else class="no-image">無照片</div>
                            </div>
                            <div class="pet-info">
                                <h3>{{ pet.name }}</h3>
                                <div class="pet-details">
                                    <p><strong>種類：</strong>{{ getSpeciesText(pet.species) }}</p>
                                    <p v-if="pet.breed"><strong>品種：</strong>{{ pet.breed }}</p>
                                    <p v-if="pet.age !== null && pet.age !== undefined"><strong>年齡：</strong>{{ pet.age
                                    }} 歲</p>
                                    <p><strong>性別：</strong>{{ getGenderText(pet.gender) }}</p>
                                    <p><strong>地點：</strong>{{ pet.location }}</p>
                                    <p v-if="pet.description"><strong>描述：</strong>{{ pet.description }}</p>
                                    <div class="pet-health">
                                        <span v-if="pet.isVaccinated" class="health-badge">已施打疫苗</span>
                                        <span v-if="pet.isNeutered" class="health-badge">已結紮</span>
                                        <span v-if="pet.isHealthy" class="health-badge">健康</span>
                                    </div>
                                </div>
                                <div class="pet-actions">
                                    <button @click="handleApprove(pet.id)" :disabled="reviewing[pet.id]"
                                        class="btn-approve">
                                        {{ reviewing[pet.id] ? '審核中...' : '通過' }}
                                    </button>
                                    <button @click="handleReject(pet.id)" :disabled="reviewing[pet.id]"
                                        class="btn-reject">
                                        {{ reviewing[pet.id] ? '審核中...' : '拒絕' }}
                                    </button>
                                </div>
                                <div v-if="reviewMessages[pet.id]"
                                    :class="['review-message', reviewMessages[pet.id].type]">
                                    {{ reviewMessages[pet.id].text }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth.js';
import { getPendingReviewPets, reviewPet, getPetPhotos } from '../utils/pets.js';

const router = useRouter();
const { currentUser, userData } = useAuth();

// 待審核寵物相關狀態
const pendingPets = ref([]);
const loadingPets = ref(false);
const errorPets = ref('');
const reviewing = ref({});
const reviewMessages = ref({});

// 載入待審核寵物列表
async function loadPendingPets() {
    loadingPets.value = true;
    errorPets.value = '';

    try {
        const result = await getPendingReviewPets();

        if (result.success) {
            const petsWithPhotos = await Promise.all(
                result.pets.map(async (pet) => {
                    const photoResult = await getPetPhotos(pet.id);
                    return {
                        ...pet,
                        mainPhoto: photoResult.success && photoResult.photos.length > 0
                            ? photoResult.photos[0].photoUrl
                            : null
                    };
                })
            );

            pendingPets.value = petsWithPhotos;
        } else {
            errorPets.value = result.message || '載入待審核寵物失敗';
        }
    } catch (error) {
        console.error('載入待審核寵物失敗:', error);
        errorPets.value = '載入待審核寵物失敗，請稍後再試';
    } finally {
        loadingPets.value = false;
    }
}

// 審核通過
async function handleApprove(petId) {
    await handleReview(petId, 'approve');
}

// 審核拒絕
async function handleReject(petId) {
    await handleReview(petId, 'reject');
}

// 處理審核（UC-06：傳遞管理員資訊以記錄稽核軌跡）
async function handleReview(petId, action) {
    reviewing.value[petId] = true;
    reviewMessages.value[petId] = null;

    try {
        const adminInfo = {
            userId: userData.value?.userId || currentUser.value?.uid,
            email: userData.value?.email || currentUser.value?.email,
            name: userData.value?.name || '管理員'
        };

        const result = await reviewPet(petId, action, adminInfo);

        if (result.success) {
            reviewMessages.value[petId] = {
                type: 'success',
                text: result.message
            };

            pendingPets.value = pendingPets.value.filter(pet => pet.id !== petId);

            setTimeout(() => {
                delete reviewMessages.value[petId];
            }, 3000);
        } else {
            reviewMessages.value[petId] = {
                type: 'error',
                text: result.message || '審核失敗'
            };
        }
    } catch (error) {
        console.error('審核失敗:', error);
        reviewMessages.value[petId] = {
            type: 'error',
            text: `審核失敗: ${error.message}`
        };
    } finally {
        reviewing.value[petId] = false;
    }
}

function getSpeciesText(species) {
    const map = { dog: '狗', cat: '貓', other: '其他' };
    return map[species] || species;
}

function getGenderText(gender) {
    const map = { male: '公', female: '母', unknown: '未知' };
    return map[gender] || gender;
}

onMounted(() => {
    if (userData.value?.role !== 'Admin') {
        router.push('/');
        return;
    }
    loadPendingPets();
});
</script>

<style scoped>
.pet-review-page {
    min-height: 100vh;
    background: #f9fafb;
    padding: 40px 20px;
}

.admin-container {
    max-width: 1200px;
    margin: 0 auto;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
}

.page-header h1 {
    font-size: 2rem;
    color: #111827;
    margin: 0;
}

.btn-back {
    padding: 8px 16px;
    background: #f3f4f6;
    color: #374151;
    text-decoration: none;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: all 0.2s;
}

.btn-back:hover {
    background: #e5e7eb;
}

.admin-content {
    background: #ffffff;
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.pending-pets-section h2 {
    font-size: 1.5rem;
    color: #111827;
    margin-bottom: 8px;
}

.section-description {
    color: #6b7280;
    margin-bottom: 24px;
}

.loading-message,
.error-message,
.empty-message {
    text-align: center;
    padding: 40px;
    color: #6b7280;
}

.error-message {
    color: #ef4444;
    background: #fee2e2;
    border-radius: 8px;
    border: 1px solid #fca5a5;
}

.pets-list {
    display: grid;
    gap: 24px;
}

.pet-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    gap: 24px;
    transition: all 0.2s;
}

.pet-card:hover {
    border-color: #16a085;
    box-shadow: 0 4px 12px rgba(22, 160, 133, 0.1);
}

.pet-image {
    width: 200px;
    height: 200px;
    flex-shrink: 0;
    border-radius: 8px;
    overflow: hidden;
    background: #e5e7eb;
}

.pet-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.no-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    font-size: 0.9rem;
}

.pet-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.pet-info h3 {
    font-size: 1.25rem;
    color: #111827;
    margin: 0;
}

.pet-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.pet-details p {
    margin: 0;
    color: #4b5563;
    font-size: 0.95rem;
}

.pet-health {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 8px;
}

.health-badge {
    padding: 4px 12px;
    background: #dcfce7;
    color: #166534;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 500;
}

.pet-actions {
    display: flex;
    gap: 12px;
    margin-top: auto;
}

.btn-approve,
.btn-reject {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-approve {
    background: #16a085;
    color: #ffffff;
}

.btn-approve:hover:not(:disabled) {
    background: #13866f;
}

.btn-reject {
    background: #ef4444;
    color: #ffffff;
}

.btn-reject:hover:not(:disabled) {
    background: #dc2626;
}

.btn-approve:disabled,
.btn-reject:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.review-message {
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 0.9rem;
    margin-top: 8px;
}

.review-message.success {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
}

.review-message.error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
}

@media (max-width: 640px) {
    .pet-card {
        flex-direction: column;
    }

    .pet-image {
        width: 100%;
        height: 250px;
    }
}
</style>
