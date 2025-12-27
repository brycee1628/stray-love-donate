<template>
  <div class="notifications-page">
    <div class="container">
      <div class="page-header">
        <h1>我的通知</h1>
        <button v-if="unreadCount > 0" @click="markAllAsRead" class="btn-mark-all">
          標記全部為已讀
        </button>
      </div>

      <div v-if="loading" class="loading">
        <p>載入中...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
      </div>

      <div v-else-if="notifications.length === 0" class="empty">
        <p>目前沒有通知</p>
      </div>

      <div v-else class="notifications-list">
        <div v-for="notification in notifications" :key="notification.id"
          :class="['notification-item', { 'unread': !notification.read }]"
          @click="handleNotificationClick(notification)">
          <div class="notification-content">
            <div class="notification-header">
              <span class="notification-type">{{ getNotificationTypeText(notification.type) }}</span>
              <span class="notification-time">{{ formatTime(notification.createTime) }}</span>
            </div>
            <p class="notification-message">{{ notification.message }}</p>
            <p v-if="notification.reason" class="notification-reason">拒絕原因：{{ notification.reason }}</p>
            <div v-if="notification.petId" class="notification-actions">
              <router-link :to="`/filter?petId=${notification.petId}`" class="btn-view-pet" @click.stop>
                查看寵物
              </router-link>
            </div>
          </div>
          <div v-if="!notification.read" class="unread-indicator"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth.js';
import { getUserAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../utils/adoption.js';

const router = useRouter();
const { currentUser } = useAuth();

const notifications = ref([]);
const loading = ref(true);
const error = ref(null);
const unreadCount = ref(0);

// 載入所有通知（包括已讀和未讀）
async function loadNotifications() {
  loading.value = true;
  error.value = null;

  try {
    const result = await getUserAllNotifications(currentUser.value?.uid);
    if (result.success) {
      notifications.value = result.notifications;
      unreadCount.value = notifications.value.filter(n => !n.read).length;
    } else {
      error.value = result.message || '載入通知失敗';
    }
  } catch (err) {
    console.error('載入通知失敗:', err);
    error.value = `載入通知失敗: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

// 處理通知點擊
async function handleNotificationClick(notification) {
  if (!notification.read) {
    // 標記為已讀
    try {
      await markNotificationAsRead(notification.id);
      notification.read = true;
      unreadCount.value = notifications.value.filter(n => !n.read).length;
      // 觸發通知更新事件
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (err) {
      console.error('標記通知為已讀失敗:', err);
    }
  }
}

// 標記全部為已讀
async function markAllAsRead() {
  try {
    const result = await markAllNotificationsAsRead(currentUser.value?.uid);
    if (result.success) {
      // 更新本地狀態
      notifications.value.forEach(n => n.read = true);
      unreadCount.value = 0;
      // 觸發通知更新事件
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } else {
      alert(result.message || '標記失敗');
    }
  } catch (err) {
    console.error('標記全部為已讀失敗:', err);
    alert(`標記失敗: ${err.message}`);
  }
}

// 取得通知類型文字
function getNotificationTypeText(type) {
  const typeMap = {
    'adoption_approved': '領養申請通過',
    'adoption_rejected': '領養申請拒絕',
    'adoption_pending': '領養申請待審核',
    'adoption_approved_to_releaser': '寵物已被領養'
  };
  return typeMap[type] || '通知';
}

// 格式化時間
function formatTime(timestamp) {
  if (!timestamp) return '';

  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }

  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} 天前`;
  } else if (hours > 0) {
    return `${hours} 小時前`;
  } else if (minutes > 0) {
    return `${minutes} 分鐘前`;
  } else {
    return '剛剛';
  }
}

onMounted(() => {
  loadNotifications();
});
</script>

<style scoped>
.notifications-page {
  min-height: calc(100vh - 80px);
  background: #f9fafb;
  padding: 40px 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2rem;
  color: #1f2937;
  margin: 0;
}

.btn-mark-all {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-mark-all:hover {
  background: #059669;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
  font-size: 1.1rem;
}

.error {
  color: #ef4444;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border: 2px solid transparent;
}

.notification-item:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.notification-item.unread {
  border-color: #3b82f6;
  background: #eff6ff;
}

.unread-indicator {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border-radius: 50%;
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.notification-type {
  font-weight: 600;
  color: #1f2937;
  font-size: 1rem;
}

.notification-time {
  color: #6b7280;
  font-size: 0.85rem;
}

.notification-message {
  color: #374151;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.notification-reason {
  color: #6b7280;
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 8px 0 12px 0;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  border-left: 3px solid #ef4444;
}

.notification-actions {
  margin-top: 12px;
}

.btn-view-pet {
  display: inline-block;
  background: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-view-pet:hover {
  background: #2563eb;
}

@media (max-width: 640px) {
  .notifications-page {
    padding: 20px 10px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .notification-item {
    padding: 16px;
  }

  .notification-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
