<template>
    <div class="admin-page">
        <div class="admin-container">
            <h1>管理後台</h1>
            <div class="admin-content">
                <div class="welcome-section">
                    <p>歡迎，{{ userData?.name || userData?.email || '管理員' }}！</p>
                    <p class="role-badge">角色：{{ userData?.role || 'Admin' }}</p>
                </div>

                <!-- 後台功能導航（UC-06：分離為獨立路徑） -->
                <div class="admin-sections">
                    <router-link to="/admin/pet-review" class="section-card">
                        <h2>刊登審核</h2>
                        <p>管理待審核的寵物上架申請</p>
                        <span class="card-arrow">→</span>
                    </router-link>

                    <router-link to="/admin/user-management" class="section-card">
                        <h2>會員管理</h2>
                        <p>管理使用者帳號與權限</p>
                        <span class="card-arrow">→</span>
                    </router-link>

                    <router-link to="/admin/audit-log" class="section-card">
                        <h2>稽核軌跡</h2>
                        <p>查看所有審核操作與會員管理記錄</p>
                        <span class="card-arrow">→</span>
                    </router-link>
                </div>

                <!-- 待審核領養申請列表 -->
                <div class="pending-applications-section">
                    <h2>待審核領養申請</h2>
                    <p class="section-description">管理待審核的領養申請</p>

                    <div v-if="loadingApplications" class="loading-message">載入中...</div>
                    <div v-else-if="errorApplications" class="error-message">{{ errorApplications }}</div>
                    <div v-else-if="pendingApplications.length === 0" class="empty-message">目前沒有待審核的領養申請</div>
                    <div v-else class="applications-list">
                        <div v-for="app in pendingApplications" :key="app.id" class="application-card">
                            <div class="application-main">
                                <h3>申請人：{{ app.applicantName }}</h3>
                                <p><strong>電子郵件：</strong>{{ app.email }}</p>
                                <p><strong>聯絡電話：</strong>{{ app.phone }}</p>
                                <p><strong>寵物 ID：</strong>{{ app.petId }}</p>
                                <p><strong>居住地址：</strong>{{ app.address }}</p>
                                <p><strong>居住環境：</strong>{{ app.livingEnvironment }}</p>
                                <p v-if="app.hasYard !== null"><strong>是否有庭院：</strong>{{ app.hasYard ? '是' : '否' }}</p>
                                <p><strong>飼養經驗：</strong>{{ app.experience }}</p>
                                <p><strong>照顧計畫：</strong>{{ app.carePlan }}</p>
                                <p v-if="app.familyMembers"><strong>家庭成員：</strong>{{ app.familyMembers }}</p>
                            </div>
                            <div class="application-actions">
                                <button @click="handleApproveApplication(app.id)"
                                    :disabled="reviewingApplications[app.id]" class="btn-approve">
                                    {{ reviewingApplications[app.id] ? '審核中...' : '通過' }}
                                </button>
                                <button @click="handleRejectApplication(app.id)"
                                    :disabled="reviewingApplications[app.id]" class="btn-reject">
                                    {{ reviewingApplications[app.id] ? '審核中...' : '拒絕' }}
                                </button>
                                <div v-if="applicationMessages[app.id]"
                                    :class="['review-message', applicationMessages[app.id].type]">
                                    {{ applicationMessages[app.id].text }}
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
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth.js';
import { getPendingAdoptionApplications, reviewAdoptionApplication } from '../utils/adoption.js';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config.js';

const router = useRouter();
const { currentUser, userData, logout } = useAuth();

// 待審核領養申請相關狀態
const pendingApplications = ref([]);
const loadingApplications = ref(false);
const errorApplications = ref('');
const reviewingApplications = ref({}); // { applicationId: boolean }
const applicationMessages = ref({}); // { applicationId: { type: 'success'|'error', text: string } }
let applicationsUnsubscribe = null; // 實時監聽的取消函數

// 載入待審核領養申請
async function loadPendingApplications() {
    loadingApplications.value = true;
    errorApplications.value = '';

    try {
        const result = await getPendingAdoptionApplications();
        if (result.success) {
            pendingApplications.value = result.applications;
        } else {
            errorApplications.value = result.message || '載入待審核領養申請失敗';
        }
    } catch (error) {
        console.error('載入待審核領養申請失敗:', error);
        errorApplications.value = '載入待審核領養申請失敗，請稍後再試';
    } finally {
        loadingApplications.value = false;
    }
}

// 設置實時監聽待審核申請
function setupApplicationsListener() {
    // 清除舊的監聽器
    if (applicationsUnsubscribe) {
        applicationsUnsubscribe();
        applicationsUnsubscribe = null;
    }

    try {
        // 嘗試使用 where + orderBy 查詢
        const applicationsQuery = query(
            collection(db, 'adoptionApplications'),
            where('status', '==', 'Pending'),
            orderBy('createTime', 'desc')
        );

        applicationsUnsubscribe = onSnapshot(
            applicationsQuery,
            (snapshot) => {
                // 實時更新列表
                const applications = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                pendingApplications.value = applications;
                loadingApplications.value = false;
            },
            (error) => {
                console.warn('監聽申請失敗（可能需要索引），改用降級方案:', error);
                // 降級為監聽所有申請，然後客戶端過濾
                setupFallbackApplicationsListener();
            }
        );
    } catch (queryError) {
        console.warn('建立查詢失敗，使用降級方案:', queryError);
        setupFallbackApplicationsListener();
    }
}

// 降級方案：監聽所有申請並在客戶端過濾
function setupFallbackApplicationsListener() {
    // 清除舊的監聽器
    if (applicationsUnsubscribe) {
        applicationsUnsubscribe();
        applicationsUnsubscribe = null;
    }

    // 設置載入狀態
    loadingApplications.value = true;
    errorApplications.value = '';

    // 監聽所有申請（不使用 where 和 orderBy，避免索引問題）
    const allApplicationsQuery = query(collection(db, 'adoptionApplications'));

    applicationsUnsubscribe = onSnapshot(
        allApplicationsQuery,
        (snapshot) => {
            // 客戶端過濾：只保留狀態為 Pending 的申請
            let applications = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(app => app.status === 'Pending');

            // 依 createTime 由新到舊排序
            if (applications.length > 0 && applications[0].createTime) {
                applications.sort((a, b) => {
                    const timeA = a.createTime?.toMillis ? a.createTime.toMillis() : (a.createTime?.seconds || 0) * 1000;
                    const timeB = b.createTime?.toMillis ? b.createTime.toMillis() : (b.createTime?.seconds || 0) * 1000;
                    return timeB - timeA;
                });
            }

            pendingApplications.value = applications;
            loadingApplications.value = false;
            errorApplications.value = '';
        },
        (error) => {
            console.error('降級監聽也失敗:', error);
            // 如果實時監聽失敗，改用輪詢
            loadPendingApplications();
        }
    );
}

// 領養申請審核通過
async function handleApproveApplication(applicationId) {
    await handleReviewApplication(applicationId, 'approve');
}

// 領養申請審核拒絕
async function handleRejectApplication(applicationId) {
    // 顯示輸入原因的對話框
    const reason = window.prompt('請輸入拒絕原因：');
    if (reason === null) {
        // 使用者取消輸入
        return;
    }
    await handleReviewApplication(applicationId, 'reject', reason.trim() || null);
}

// 處理領養申請審核（UC-06：傳遞管理員資訊以記錄稽核軌跡）
async function handleReviewApplication(applicationId, action, reason = null) {
    reviewingApplications.value[applicationId] = true;
    applicationMessages.value[applicationId] = null;

    try {
        // 準備管理員資訊
        const adminInfo = {
            userId: userData.value?.userId || currentUser.value?.uid,
            email: userData.value?.email || currentUser.value?.email,
            name: userData.value?.name || '管理員'
        };

        const result = await reviewAdoptionApplication(applicationId, action, adminInfo, reason);
        if (result.success) {
            applicationMessages.value[applicationId] = {
                type: 'success',
                text: result.message
            };
            // 從列表中移除已審核的申請
            pendingApplications.value = pendingApplications.value.filter(app => app.id !== applicationId);
            // 觸發通知數量更新（通知 App.vue 重新載入通知數量）
            window.dispatchEvent(new CustomEvent('notification-updated'));
            setTimeout(() => {
                delete applicationMessages.value[applicationId];
            }, 3000);
        } else {
            applicationMessages.value[applicationId] = {
                type: 'error',
                text: result.message || '審核失敗'
            };
        }
    } catch (error) {
        console.error('審核領養申請失敗:', error);
        applicationMessages.value[applicationId] = {
            type: 'error',
            text: `審核失敗: ${error.message}`
        };
    } finally {
        reviewingApplications.value[applicationId] = false;
    }
}

// 處理登出
async function handleLogout() {
    try {
        await logout();
        router.push('/');
    } catch (error) {
        console.error('登出失敗:', error);
    }
}

onMounted(() => {
    // 確保只有管理員可以訪問
    if (userData.value?.role !== 'Admin') {
        router.push('/');
        return;
    }

    // 設置實時監聽，當有新申請時自動更新列表（會自動載入初始資料）
    setupApplicationsListener();

    // 如果實時監聽失敗，則使用傳統方式載入
    // 注意：實時監聽成功時會自動更新列表，所以不需要先調用 loadPendingApplications

    // 監聽通知更新事件（作為備用）
    window.addEventListener('notification-updated', loadPendingApplications);
});

onUnmounted(() => {
    // 清除實時監聽
    if (applicationsUnsubscribe) {
        applicationsUnsubscribe();
        applicationsUnsubscribe = null;
    }
    // 移除事件監聽
    window.removeEventListener('notification-updated', loadPendingApplications);
});
</script>

<style scoped>
.admin-page {
    min-height: 100vh;
    background: #f9fafb;
    padding: 40px 20px;
}

.admin-container {
    max-width: 1200px;
    margin: 0 auto;
}

h1 {
    font-size: 2rem;
    color: #111827;
    margin-bottom: 32px;
    text-align: center;
}

.admin-content {
    background: #ffffff;
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.welcome-section {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 2px solid #e5e7eb;
}

.welcome-section p {
    font-size: 1.1rem;
    color: #374151;
    margin: 8px 0;
}

.role-badge {
    display: inline-block;
    padding: 6px 12px;
    background: #16a085;
    color: #ffffff;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    margin-top: 8px;
}

.pending-pets-section {
    margin-bottom: 40px;
    padding-bottom: 32px;
    border-bottom: 2px solid #e5e7eb;
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

.pending-applications-section {
    margin-bottom: 40px;
    padding-bottom: 32px;
    border-bottom: 2px solid #e5e7eb;
}

.applications-list {
    display: grid;
    gap: 24px;
}

.application-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    justify-content: space-between;
    gap: 24px;
}

.application-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.application-main h3 {
    font-size: 1.25rem;
    color: #111827;
    margin: 0 0 8px;
}

.application-main p {
    margin: 0;
    color: #4b5563;
    font-size: 0.95rem;
}

.application-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-end;
}

.admin-sections {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
}

.section-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    transition: all 0.2s;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    position: relative;
}

.section-card:hover {
    border-color: #16a085;
    box-shadow: 0 4px 12px rgba(22, 160, 133, 0.1);
    transform: translateY(-2px);
}

.section-card h2 {
    font-size: 1.25rem;
    color: #111827;
    margin-bottom: 12px;
}

.section-card p {
    color: #6b7280;
    margin: 8px 0;
    font-size: 0.95rem;
}

.card-arrow {
    position: absolute;
    top: 24px;
    right: 24px;
    font-size: 1.5rem;
    color: #16a085;
    transition: transform 0.2s;
}

.section-card:hover .card-arrow {
    transform: translateX(4px);
}

.admin-actions {
    display: flex;
    justify-content: center;
    padding-top: 24px;
    border-top: 2px solid #e5e7eb;
}

.btn-logout {
    padding: 12px 24px;
    background: #ef4444;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-logout:hover {
    background: #dc2626;
}

@media (max-width: 640px) {
    .admin-container {
        padding: 0;
    }

    .admin-content {
        padding: 24px 16px;
    }

    .admin-sections {
        grid-template-columns: 1fr;
    }

    .pet-card {
        flex-direction: column;
    }

    .pet-image {
        width: 100%;
        height: 250px;
    }
}
</style>
