<template>
    <div class="site-detail-page">
        <div class="container">
            <div v-if="loading" class="loading-message">載入中...</div>
            <div v-else-if="error" class="error-message">{{ error }}</div>
            <div v-else-if="site" class="site-detail">
                <!-- 返回按鈕 -->
                <button @click="goBack" class="btn-back">← 返回</button>

                <!-- 站點標題 -->
                <div class="site-header">
                    <h1>{{ site.name }}</h1>
                    <span class="region-badge">{{ site.region }}</span>
                </div>

                <!-- 站點詳細資訊 -->
                <div class="site-content">
                    <div class="info-section">
                        <h2>基本資訊</h2>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">📍 地址：</span>
                                <span>{{ site.address }}</span>
                            </div>
                            <div v-if="site.phone" class="info-item">
                                <span class="info-label">📞 電話：</span>
                                <a :href="`tel:${site.phone}`">{{ site.phone }}</a>
                            </div>
                            <div v-if="site.email" class="info-item">
                                <span class="info-label">✉️ Email：</span>
                                <a :href="`mailto:${site.email}`">{{ site.email }}</a>
                            </div>
                        </div>
                    </div>

                    <div v-if="site.description" class="info-section">
                        <h2>說明</h2>
                        <p class="description">{{ site.description }}</p>
                    </div>

                    <!-- 操作按鈕 -->
                    <div class="action-section">
                        <button @click="openMap" :disabled="!site.hasMapUrl()"
                            :class="['btn-action', { disabled: !site.hasMapUrl() }]" title="查看地圖">
                            🗺️ 查看地圖
                        </button>
                        <button @click="openWebsite" :disabled="!site.hasWebsiteUrl()"
                            :class="['btn-action', { disabled: !site.hasWebsiteUrl() }]" title="官方網站">
                            🌐 官方網站
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAllShelterSites } from '../utils/shelters.js';
import { ShelterSite } from '../models/ShelterSite.js';

const route = useRoute();
const router = useRouter();

const site = ref(null);
const loading = ref(true);
const error = ref('');

// 載入站點資訊
function loadSite() {
    loading.value = true;
    error.value = '';

    try {
        const siteId = route.params.siteId;
        const allSites = getAllShelterSites();
        const foundSite = allSites.find(s => s.siteId === siteId);

        if (foundSite) {
            site.value = foundSite;
        } else {
            error.value = '找不到指定的站點';
        }
    } catch (err) {
        console.error('載入站點失敗:', err);
        error.value = '載入站點資料失敗，請稍後再試';
    } finally {
        loading.value = false;
    }
}

// 開啟地圖
function openMap() {
    if (site.value instanceof ShelterSite) {
        site.value.openMap();
    }
}

// 開啟官方網站
function openWebsite() {
    if (site.value instanceof ShelterSite) {
        site.value.openWebsite();
    }
}

// 返回上一頁
function goBack() {
    router.back();
}

onMounted(() => {
    loadSite();
});
</script>

<style scoped>
.site-detail-page {
    min-height: 100vh;
    background: #f9fafb;
    padding: 40px 20px;
}

.container {
    max-width: 800px;
    margin: 0 auto;
}

.btn-back {
    margin-bottom: 24px;
    padding: 8px 16px;
    background: #ffffff;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-back:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
}

.loading-message,
.error-message {
    text-align: center;
    padding: 60px 20px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.error-message {
    color: #ef4444;
    background: #fee2e2;
    border: 1px solid #fca5a5;
}

.site-detail {
    background: #ffffff;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.site-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 2px solid #e5e7eb;
}

.site-header h1 {
    font-size: 2rem;
    color: #111827;
    margin: 0;
    flex: 1;
}

.region-badge {
    padding: 6px 16px;
    background: #e0f2fe;
    color: #0f766e;
    border-radius: 999px;
    font-size: 0.9rem;
    font-weight: 500;
    white-space: nowrap;
}

.site-content {
    display: flex;
    flex-direction: column;
    gap: 32px;
}

.info-section h2 {
    font-size: 1.25rem;
    color: #111827;
    margin: 0 0 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e7eb;
}

.info-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.info-item {
    font-size: 1rem;
    color: #4b5563;
    line-height: 1.6;
}

.info-label {
    font-weight: 600;
    color: #374151;
    margin-right: 8px;
}

.info-item a {
    color: #16a085;
    text-decoration: none;
}

.info-item a:hover {
    text-decoration: underline;
}

.description {
    font-size: 1rem;
    color: #6b7280;
    line-height: 1.8;
    margin: 0;
}

.action-section {
    display: flex;
    gap: 12px;
    padding-top: 24px;
    border-top: 1px solid #e5e7eb;
}

.btn-action {
    flex: 1;
    padding: 12px 24px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #ffffff;
    color: #374151;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-action:hover:not(.disabled) {
    background: #16a085;
    color: #ffffff;
    border-color: #16a085;
}

.btn-action.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f3f4f6;
}

@media (max-width: 768px) {
    .site-header {
        flex-direction: column;
        gap: 12px;
    }

    .action-section {
        flex-direction: column;
    }
}
</style>
