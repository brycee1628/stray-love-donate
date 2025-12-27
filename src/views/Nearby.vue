<template>
  <div class="nearby-page">
    <div class="container">
      <div class="page-header">
        <h1>合作站點查詢</h1>
        <p class="subtitle">尋找附近的中途之家與收容所，給毛孩一個溫暖的家</p>
      </div>

      <!-- 搜尋區 -->
      <div class="search-section">
        <div class="search-form">
          <div class="search-group">
            <label for="keyword">關鍵字搜尋</label>
            <input id="keyword" type="text" v-model="searchKeyword" placeholder="輸入站點名稱、地址或關鍵字..." @input="handleSearch"
              @keyup.enter="performSearch" />
            <p v-if="keywordError" class="error-text">{{ keywordError }}</p>
          </div>
          <div class="search-group">
            <label for="region">地區篩選</label>
            <select id="region" v-model="selectedRegion" @change="performSearch">
              <option value="all">全部地區</option>
              <option value="台北市">台北市</option>
              <option value="新北市">新北市</option>
              <option value="桃園市">桃園市</option>
              <option value="新竹市">新竹市</option>
              <option value="台中市">台中市</option>
              <option value="彰化縣">彰化縣</option>
              <option value="嘉義市">嘉義市</option>
              <option value="台南市">台南市</option>
              <option value="高雄市">高雄市</option>
              <option value="宜蘭縣">宜蘭縣</option>
            </select>
          </div>
          <div class="search-actions">
            <button @click="performSearch" class="btn-search">搜尋</button>
            <button @click="resetSearch" class="btn-reset">重置</button>
          </div>
        </div>
      </div>

      <!-- 結果區 -->
      <div class="results-section">
        <div v-if="loading" class="loading-message">載入中...</div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <div v-else-if="filteredSites.length === 0" class="empty-message">
          <p>找不到符合條件的站點</p>
          <button @click="resetSearch" class="btn-link">查看所有站點</button>
        </div>
        <div v-else class="sites-grid">
          <div v-for="site in filteredSites" :key="site.siteId" class="site-card">
            <div class="site-header">
              <h3 @click="goToSiteDetail(site.siteId)" class="site-name-link">{{ site.name }}</h3>
              <span class="region-badge">{{ site.region }}</span>
            </div>
            <div class="site-body">
              <div class="site-info">
                <p class="info-item">
                  <span class="info-label">📍 地址：</span>
                  <span>{{ site.address }}</span>
                </p>
                <p v-if="site.phone" class="info-item">
                  <span class="info-label">📞 電話：</span>
                  <a :href="`tel:${site.phone}`">{{ site.phone }}</a>
                </p>
                <p v-if="site.email" class="info-item">
                  <span class="info-label">✉️ Email：</span>
                  <a :href="`mailto:${site.email}`">{{ site.email }}</a>
                </p>
                <p v-if="site.description" class="info-item description">
                  <span class="info-label">📝 說明：</span>
                  <span>{{ site.description }}</span>
                </p>
              </div>
              <div class="site-actions">
                <button @click="openMap(site)" :disabled="!site.hasMapUrl()"
                  :class="['btn-action', { disabled: !site.hasMapUrl() }]" title="查看地圖">
                  🗺️ 查看地圖
                </button>
                <button @click="openWebsite(site)" :disabled="!site.hasWebsiteUrl()"
                  :class="['btn-action', { disabled: !site.hasWebsiteUrl() }]" title="官方網站">
                  🌐 官方網站
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 統計資訊 -->
      <div v-if="!loading && !error" class="stats-section">
        <p>找到 <strong>{{ filteredSites.length }}</strong> 個站點</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAllShelterSites, searchShelterSites, validateKeyword } from '../utils/shelters.js';
import { ShelterSite } from '../models/ShelterSite.js';

const router = useRouter();

const allSites = ref([]);
const filteredSites = ref([]);
const loading = ref(false);
const error = ref('');
const searchKeyword = ref('');
const selectedRegion = ref('all');
const keywordError = ref('');

// 載入所有站點（不輸入直接瀏覽模式）
async function loadAllSites() {
  loading.value = true;
  error.value = '';
  keywordError.value = '';

  try {
    const sites = getAllShelterSites();
    allSites.value = sites;
    filteredSites.value = sites;
  } catch (err) {
    console.error('載入站點失敗:', err);
    error.value = '載入站點資料失敗，請稍後再試';
  } finally {
    loading.value = false;
  }
}

// 處理搜尋輸入（即時驗證）
function handleSearch() {
  keywordError.value = '';
  if (searchKeyword.value.trim()) {
    if (!validateKeyword(searchKeyword.value)) {
      keywordError.value = '搜尋關鍵字包含不當字詞，請重新輸入';
    }
  }
}

// 執行搜尋
function performSearch() {
  if (keywordError.value) {
    return; // 如果有錯誤，不執行搜尋
  }

  loading.value = true;
  error.value = '';

  try {
    const result = searchShelterSites(searchKeyword.value.trim(), selectedRegion.value);

    if (result.success) {
      filteredSites.value = result.sites;
    } else {
      error.value = result.message || '搜尋失敗';
      filteredSites.value = [];
    }
  } catch (err) {
    console.error('搜尋失敗:', err);
    error.value = '搜尋失敗，請稍後再試';
    filteredSites.value = [];
  } finally {
    loading.value = false;
  }
}

// 重置搜尋
function resetSearch() {
  searchKeyword.value = '';
  selectedRegion.value = 'all';
  keywordError.value = '';
  filteredSites.value = allSites.value;
}

// 開啟地圖（序列圖 4.4：openMap() 方法）
function openMap(site) {
  if (site instanceof ShelterSite) {
    site.openMap();
  }
}

// 開啟官方網站
function openWebsite(site) {
  if (site instanceof ShelterSite) {
    site.openWebsite();
  }
}

// 導向站點詳細資訊頁
function goToSiteDetail(siteId) {
  router.push(`/nearby/${siteId}`);
}

onMounted(() => {
  loadAllSites();
});
</script>

<style scoped>
.nearby-page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 40px 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #111827;
  margin: 0 0 12px;
}

.subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0;
}

.search-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.search-form {
  display: grid;
  grid-template-columns: 2fr 1fr auto;
  gap: 16px;
  align-items: end;
}

.search-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

.search-group input,
.search-group select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-group input:focus,
.search-group select:focus {
  outline: none;
  border-color: #16a085;
  box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.1);
}

.error-text {
  color: #ef4444;
  font-size: 0.85rem;
  margin: 4px 0 0;
}

.search-actions {
  display: flex;
  gap: 8px;
}

.btn-search,
.btn-reset {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-search {
  background: #16a085;
  color: #ffffff;
}

.btn-search:hover {
  background: #13866f;
}

.btn-reset {
  background: #f3f4f6;
  color: #374151;
}

.btn-reset:hover {
  background: #e5e7eb;
}

.results-section {
  margin-bottom: 24px;
}

.loading-message,
.error-message,
.empty-message {
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

.empty-message {
  color: #6b7280;
}

.btn-link {
  margin-top: 16px;
  padding: 8px 16px;
  background: #16a085;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-link:hover {
  background: #13866f;
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.site-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.site-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.site-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.site-header h3 {
  font-size: 1.25rem;
  color: #111827;
  margin: 0;
  flex: 1;
}

.site-name-link {
  cursor: pointer;
  transition: color 0.2s;
}

.site-name-link:hover {
  color: #16a085;
}

.region-badge {
  padding: 4px 12px;
  background: #e0f2fe;
  color: #0f766e;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
}

.site-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.site-info {
  flex: 1;
  margin-bottom: 16px;
}

.info-item {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #4b5563;
  line-height: 1.6;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 600;
  color: #374151;
  margin-right: 4px;
}

.info-item.description {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 0.9rem;
}

.info-item a {
  color: #16a085;
  text-decoration: none;
}

.info-item a:hover {
  text-decoration: underline;
}

.site-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.btn-action {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #374151;
  font-size: 0.9rem;
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

.stats-section {
  text-align: center;
  padding: 20px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  color: #6b7280;
}

.stats-section strong {
  color: #16a085;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .search-form {
    grid-template-columns: 1fr;
  }

  .search-actions {
    grid-column: 1;
  }

  .sites-grid {
    grid-template-columns: 1fr;
  }

  .site-header {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
