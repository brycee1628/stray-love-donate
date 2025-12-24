<template>
    <div class="user-management-page">
        <div class="admin-container">
            <div class="page-header">
                <h1>會員管理</h1>
                <router-link to="/admin" class="btn-back">← 返回後台首頁</router-link>
            </div>
            <div class="admin-content">
                <div class="users-section">
                    <h2>使用者列表</h2>
                    <p class="section-description">管理使用者帳號與權限</p>

                    <div v-if="loading" class="loading-message">載入中...</div>
                    <div v-else-if="error" class="error-message">{{ error }}</div>
                    <div v-else-if="users.length === 0" class="empty-message">目前沒有使用者</div>
                    <div v-else class="users-list">
                        <div v-for="user in users" :key="user.id" class="user-card">
                            <div class="user-info">
                                <h3>{{ user.name || user.email }}</h3>
                                <div class="user-details">
                                    <p><strong>電子郵件：</strong>{{ user.email }}</p>
                                    <p v-if="user.phone"><strong>電話：</strong>{{ user.phone }}</p>
                                    <p><strong>角色：</strong>{{ getRoleText(user.role) }}</p>
                                    <p><strong>狀態：</strong>
                                        <span :class="['status-badge', getStatusClass(user.status)]">
                                            {{ getStatusText(user.status) }}
                                        </span>
                                    </p>
                                    <p v-if="user.createTime">
                                        <strong>註冊時間：</strong>
                                        {{ formatDate(user.createTime) }}
                                    </p>
                                </div>
                            </div>
                            <div class="user-actions">
                                <button v-if="user.status === 'Active' || user.status === 'Inactive'"
                                    @click="handleSuspend(user.id)" :disabled="processing[user.id]" class="btn-suspend">
                                    {{ processing[user.id] ? '處理中...' : '停權' }}
                                </button>
                                <button v-if="user.status === 'Suspended'" @click="handleUnsuspend(user.id)"
                                    :disabled="processing[user.id]" class="btn-unsuspend">
                                    {{ processing[user.id] ? '處理中...' : '解除停權' }}
                                </button>
                                <div v-if="messages[user.id]" :class="['action-message', messages[user.id].type]">
                                    {{ messages[user.id].text }}
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
import { getAllUsers, suspendUser, unsuspendUser } from '../utils/users.js';

const router = useRouter();
const { currentUser, userData } = useAuth();

const users = ref([]);
const loading = ref(false);
const error = ref('');
const processing = ref({});
const messages = ref({});

async function loadUsers() {
    loading.value = true;
    error.value = '';

    try {
        const result = await getAllUsers();
        if (result.success) {
            users.value = result.users;
        } else {
            error.value = result.message || '載入使用者列表失敗';
        }
    } catch (err) {
        console.error('載入使用者列表失敗:', err);
        error.value = '載入使用者列表失敗，請稍後再試';
    } finally {
        loading.value = false;
    }
}

async function handleSuspend(userId) {
    processing.value[userId] = true;
    messages.value[userId] = null;

    try {
        const adminInfo = {
            userId: userData.value?.userId || currentUser.value?.uid,
            email: userData.value?.email || currentUser.value?.email,
            name: userData.value?.name || '管理員'
        };

        const result = await suspendUser(userId, adminInfo);

        if (result.success) {
            messages.value[userId] = {
                type: 'success',
                text: result.message
            };
            await loadUsers();
            setTimeout(() => {
                delete messages.value[userId];
            }, 3000);
        } else {
            messages.value[userId] = {
                type: 'error',
                text: result.message || '停權失敗'
            };
        }
    } catch (err) {
        console.error('停權失敗:', err);
        messages.value[userId] = {
            type: 'error',
            text: `停權失敗: ${err.message}`
        };
    } finally {
        processing.value[userId] = false;
    }
}

async function handleUnsuspend(userId) {
    processing.value[userId] = true;
    messages.value[userId] = null;

    try {
        const adminInfo = {
            userId: userData.value?.userId || currentUser.value?.uid,
            email: userData.value?.email || currentUser.value?.email,
            name: userData.value?.name || '管理員'
        };

        const result = await unsuspendUser(userId, adminInfo);

        if (result.success) {
            messages.value[userId] = {
                type: 'success',
                text: result.message
            };
            await loadUsers();
            setTimeout(() => {
                delete messages.value[userId];
            }, 3000);
        } else {
            messages.value[userId] = {
                type: 'error',
                text: result.message || '解除停權失敗'
            };
        }
    } catch (err) {
        console.error('解除停權失敗:', err);
        messages.value[userId] = {
            type: 'error',
            text: `解除停權失敗: ${err.message}`
        };
    } finally {
        processing.value[userId] = false;
    }
}

function getRoleText(role) {
    const map = { Admin: '管理員', User: '一般使用者' };
    return map[role] || role;
}

function getStatusText(status) {
    const map = { Active: '啟用', Inactive: '未啟用', Suspended: '已停權' };
    return map[status] || status;
}

function getStatusClass(status) {
    const map = { Active: 'active', Inactive: 'inactive', Suspended: 'suspended' };
    return map[status] || '';
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
    loadUsers();
});
</script>

<style scoped>
.user-management-page {
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

.users-section h2 {
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

.users-list {
    display: grid;
    gap: 24px;
}

.user-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    justify-content: space-between;
    gap: 24px;
    transition: all 0.2s;
}

.user-card:hover {
    border-color: #16a085;
    box-shadow: 0 4px 12px rgba(22, 160, 133, 0.1);
}

.user-info {
    flex: 1;
}

.user-info h3 {
    font-size: 1.25rem;
    color: #111827;
    margin: 0 0 12px;
}

.user-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.user-details p {
    margin: 0;
    color: #4b5563;
    font-size: 0.95rem;
}

.status-badge {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 500;
}

.status-badge.active {
    background: #dcfce7;
    color: #166534;
}

.status-badge.inactive {
    background: #fef3c7;
    color: #92400e;
}

.status-badge.suspended {
    background: #fee2e2;
    color: #991b1b;
}

.user-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-end;
}

.btn-suspend,
.btn-unsuspend {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-suspend {
    background: #ef4444;
    color: #ffffff;
}

.btn-suspend:hover:not(:disabled) {
    background: #dc2626;
}

.btn-unsuspend {
    background: #16a085;
    color: #ffffff;
}

.btn-unsuspend:hover:not(:disabled) {
    background: #13866f;
}

.btn-suspend:disabled,
.btn-unsuspend:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.action-message {
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 0.9rem;
    margin-top: 8px;
}

.action-message.success {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
}

.action-message.error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
}

@media (max-width: 640px) {
    .user-card {
        flex-direction: column;
    }
}
</style>
