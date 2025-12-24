<template>
    <div class="audit-log-page">
        <div class="admin-container">
            <div class="page-header">
                <h1>稽核軌跡</h1>
                <router-link to="/admin" class="btn-back">← 返回後台首頁</router-link>
            </div>
            <div class="admin-content">
                <div class="audit-section">
                    <div class="filter-section">
                        <h2>篩選條件</h2>
                        <div class="filter-row">
                            <div class="filter-group">
                                <label for="actionType">操作類型</label>
                                <select id="actionType" v-model="filters.actionType" @change="loadAuditLogs">
                                    <option value="">全部</option>
                                    <option value="PET_REVIEW_APPROVE">寵物審核-通過</option>
                                    <option value="PET_REVIEW_REJECT">寵物審核-拒絕</option>
                                    <option value="ADOPTION_APPROVE">領養申請-通過</option>
                                    <option value="ADOPTION_REJECT">領養申請-拒絕</option>
                                    <option value="USER_SUSPEND">使用者停權</option>
                                    <option value="USER_UNSUSPEND">使用者解除停權</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="targetType">目標類型</label>
                                <select id="targetType" v-model="filters.targetType" @change="loadAuditLogs">
                                    <option value="">全部</option>
                                    <option value="pet">寵物</option>
                                    <option value="adoption">領養申請</option>
                                    <option value="user">使用者</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div v-if="loading" class="loading-message">載入中...</div>
                    <div v-else-if="error" class="error-message">{{ error }}</div>
                    <div v-else-if="auditLogs.length === 0" class="empty-message">目前沒有稽核記錄</div>
                    <div v-else class="audit-logs-list">
                        <div v-for="log in auditLogs" :key="log.id" class="audit-log-card">
                            <div class="log-header">
                                <div class="log-action">
                                    <span :class="['action-badge', getActionClass(log.actionType)]">
                                        {{ getActionText(log.actionType) }}
                                    </span>
                                    <span class="log-time">{{ formatDate(log.timestamp) }}</span>
                                </div>
                            </div>
                            <div class="log-body">
                                <div class="log-info-row">
                                    <p><strong>管理員：</strong>{{ log.adminName || log.adminEmail || '未知' }}</p>
                                    <p v-if="log.adminEmail"><strong>管理員 Email：</strong>{{ log.adminEmail }}</p>
                                </div>
                                <div class="log-info-row">
                                    <p><strong>目標類型：</strong>{{ getTargetTypeText(log.targetType) }}</p>
                                    <p v-if="log.targetId"><strong>目標 ID：</strong>{{ log.targetId }}</p>
                                </div>
                                <div v-if="log.previousStatus || log.newStatus" class="log-info-row">
                                    <p><strong>狀態變更：</strong>
                                        <span v-if="log.previousStatus" class="status-badge previous">{{
                                            log.previousStatus }}</span>
                                        <span v-if="log.previousStatus && log.newStatus"> → </span>
                                        <span v-if="log.newStatus" class="status-badge new">{{ log.newStatus }}</span>
                                    </p>
                                </div>
                                <div v-if="log.reason" class="log-info-row">
                                    <p><strong>操作理由：</strong>{{ log.reason }}</p>
                                </div>
                                <div v-if="log.metadata && Object.keys(log.metadata).length > 0" class="log-metadata">
                                    <p><strong>詳細資訊：</strong></p>
                                    <ul>
                                        <li v-for="(value, key) in log.metadata" :key="key">
                                            <strong>{{ getMetadataKeyText(key) }}：</strong>{{ value }}
                                        </li>
                                    </ul>
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
import { getAuditLogs } from '../utils/audit.js';

const router = useRouter();
const { userData } = useAuth();

const auditLogs = ref([]);
const loading = ref(false);
const error = ref('');
const filters = ref({
    actionType: '',
    targetType: ''
});

async function loadAuditLogs() {
    loading.value = true;
    error.value = '';

    try {
        const result = await getAuditLogs(filters.value, 100);
        if (result.success) {
            auditLogs.value = result.logs;
        } else {
            error.value = result.message || '載入稽核記錄失敗';
        }
    } catch (err) {
        console.error('載入稽核記錄失敗:', err);
        error.value = '載入稽核記錄失敗，請稍後再試';
    } finally {
        loading.value = false;
    }
}

function getActionText(actionType) {
    const map = {
        PET_REVIEW_APPROVE: '寵物審核-通過',
        PET_REVIEW_REJECT: '寵物審核-拒絕',
        ADOPTION_APPROVE: '領養申請-通過',
        ADOPTION_REJECT: '領養申請-拒絕',
        USER_SUSPEND: '使用者停權',
        USER_UNSUSPEND: '使用者解除停權'
    };
    return map[actionType] || actionType;
}

function getActionClass(actionType) {
    if (actionType.includes('APPROVE')) return 'approve';
    if (actionType.includes('REJECT') || actionType.includes('SUSPEND')) return 'reject';
    if (actionType.includes('UNSUSPEND')) return 'unsuspend';
    return '';
}

function getTargetTypeText(targetType) {
    const map = { pet: '寵物', adoption: '領養申請', user: '使用者' };
    return map[targetType] || targetType;
}

function getMetadataKeyText(key) {
    const map = {
        petName: '寵物名稱',
        petId: '寵物 ID',
        applicantName: '申請人',
        userEmail: '使用者 Email',
        userName: '使用者名稱',
        petPreviousStatus: '寵物原狀態',
        petNewStatus: '寵物新狀態'
    };
    return map[key] || key;
}

function formatDate(timestamp) {
    if (!timestamp) return '未知';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('zh-TW');
}

onMounted(() => {
    if (userData.value?.role !== 'Admin') {
        router.push('/');
        return;
    }
    loadAuditLogs();
});
</script>

<style scoped>
.audit-log-page {
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

.audit-section h2 {
    font-size: 1.5rem;
    color: #111827;
    margin-bottom: 24px;
}

.filter-section {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 2px solid #e5e7eb;
}

.filter-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.filter-group label {
    font-size: 0.9rem;
    font-weight: 500;
    color: #374151;
}

.filter-group select {
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.95rem;
    background: #ffffff;
    color: #111827;
    cursor: pointer;
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

.audit-logs-list {
    display: grid;
    gap: 16px;
}

.audit-log-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.2s;
}

.audit-log-card:hover {
    border-color: #16a085;
    box-shadow: 0 2px 8px rgba(22, 160, 133, 0.1);
}

.log-header {
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e7eb;
}

.log-action {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.action-badge {
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
}

.action-badge.approve {
    background: #dcfce7;
    color: #166534;
}

.action-badge.reject {
    background: #fee2e2;
    color: #991b1b;
}

.action-badge.unsuspend {
    background: #dbeafe;
    color: #1e40af;
}

.log-time {
    color: #6b7280;
    font-size: 0.9rem;
}

.log-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.log-info-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.log-info-row p {
    margin: 0;
    color: #4b5563;
    font-size: 0.95rem;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
}

.status-badge.previous {
    background: #fef3c7;
    color: #92400e;
}

.status-badge.new {
    background: #dcfce7;
    color: #166534;
}

.log-metadata {
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
}

.log-metadata p {
    margin: 0 0 8px;
    color: #4b5563;
    font-size: 0.95rem;
}

.log-metadata ul {
    margin: 0;
    padding-left: 20px;
    color: #6b7280;
    font-size: 0.9rem;
}

.log-metadata li {
    margin: 4px 0;
}

@media (max-width: 640px) {
    .filter-row {
        grid-template-columns: 1fr;
    }

    .log-info-row {
        flex-direction: column;
        gap: 8px;
    }
}
</style>
