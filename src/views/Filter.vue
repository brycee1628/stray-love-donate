<template>
  <div class="filter-page">
    <div class="container">
      <!-- 頁面標題 -->
      <header class="page-header">
        <h1>條件篩選</h1>
        <p class="page-subtitle">依照您的條件，找到最適合的毛孩</p>
      </header>

      <!-- 篩選表單 -->
      <section class="filter-section">
        <div class="filter-form">
          <div class="filter-row">
            <div class="filter-group">
              <label for="species">種類</label>
              <select id="species" v-model="filters.species">
                <option value="all">全部</option>
                <option value="dog">狗</option>
                <option value="cat">貓</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="age">年齡</label>
              <select id="age" v-model="filters.age">
                <option value="all">全部</option>
                <option value="young">幼年（1歲以下）</option>
                <option value="adult">成年（1-7歲）</option>
                <option value="senior">老年（7歲以上）</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="gender">性別</label>
              <select id="gender" v-model="filters.gender">
                <option value="all">全部</option>
                <option value="male">公</option>
                <option value="female">母</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="location">地區</label>
              <select id="location" v-model="filters.location">
                <option value="all">全部</option>
                <option value="台北市">台北市</option>
                <option value="新北市">新北市</option>
                <option value="桃園市">桃園市</option>
                <option value="台中市">台中市</option>
                <option value="台南市">台南市</option>
                <option value="高雄市">高雄市</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>

          <div class="filter-actions">
            <button @click="applyFilters" class="btn-filter-apply">套用篩選</button>
            <button @click="resetFilters" class="btn-reset">重置篩選</button>
          </div>
        </div>
      </section>

      <!-- 排序選項 -->
      <section class="sort-section">
        <div class="sort-controls">
          <label for="sortBy">排序方式：</label>
          <select id="sortBy" v-model="sortBy" @change="applyFilters">
            <option value="createTime">最新上架</option>
            <option value="location">地區</option>
            <option value="name">名稱</option>
          </select>
          <select v-model="sortOrder" @change="applyFilters">
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </div>
        <div class="result-count">
          找到 <strong>{{ pagination.total }}</strong> 隻毛孩
        </div>
      </section>

      <!-- 載入中 -->
      <div v-if="loading" class="loading-message">
        載入中...
      </div>

      <!-- 錯誤訊息 -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- 寵物列表 -->
      <section v-if="!loading && !error" class="results-section">
        <div v-if="pets.length > 0" class="pet-grid">
          <article v-for="pet in pets" :key="pet.id" class="pet-card-list">
            <div class="pet-photo" :class="getSpeciesClass(pet.species)">
              <img v-if="pet.mainPhoto" :src="pet.mainPhoto" :alt="pet.name" />
            </div>
            <div class="pet-body">
              <h3>{{ formatPetTitle(pet) }}</h3>
              <p>{{ pet.description || '等待一個溫暖的家' }}</p>
              <div class="pet-meta">
                <span class="tag">{{ pet.location || '未指定地區' }}</span>
                <span v-if="pet.isVaccinated" class="tag tag-green">疫苗齊全</span>
                <span v-if="pet.isNeutered" class="tag">已結紮</span>
              </div>
              <div class="pet-actions">
                <router-link :to="`/adoption/${pet.id}`" class="btn-apply">
                  申請領養
                </router-link>
              </div>
            </div>
          </article>
        </div>

        <!-- 沒有結果 -->
        <div v-else class="empty-message">
          <p>目前沒有符合條件的毛孩，<a @click="resetFilters">試試其他條件</a>或<router-link to="/pet-upload">成為第一個上架的人</router-link>！</p>
        </div>
      </section>

      <!-- 分頁控制 -->
      <section v-if="!loading && !error && pets.length > 0" class="pagination-section">
        <div class="pagination">
          <button @click="goToPage(pagination.page - 1)" :disabled="!pagination.hasPrevPage" class="btn-page">
            上一頁
          </button>
          <span class="page-info">
            第 {{ pagination.page }} / {{ pagination.totalPages }} 頁
          </span>
          <button @click="goToPage(pagination.page + 1)" :disabled="!pagination.hasNextPage" class="btn-page">
            下一頁
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { searchPets, getPetPhotos } from '../utils/pets.js';

const pets = ref([]);
const loading = ref(true);
const error = ref('');

// 篩選條件
const filters = ref({
  species: 'all',
  age: 'all',
  gender: 'all',
  location: 'all'
});

// 排序設定
const sortBy = ref('createTime');
const sortOrder = ref('desc');

// 分頁設定
const pagination = ref({
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false
});

// 載入寵物資料
async function loadPets() {
  loading.value = true;
  error.value = '';

  try {
    const result = await searchPets(
      filters.value,
      sortBy.value,
      sortOrder.value,
      pagination.value.page,
      pagination.value.pageSize
    );

    if (result.success) {
      // 為每個寵物載入第一張照片
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

      pets.value = petsWithPhotos;
      pagination.value = result.pagination;
    } else {
      error.value = result.message;
    }
  } catch (err) {
    console.error('載入寵物失敗:', err);
    error.value = '載入寵物資料失敗，請稍後再試';
  } finally {
    loading.value = false;
  }
}

// 應用篩選（重置到第一頁）
function applyFilters() {
  pagination.value.page = 1;
  loadPets();
}

// 重置篩選
function resetFilters() {
  filters.value = {
    species: 'all',
    age: 'all',
    gender: 'all',
    location: 'all'
  };
  sortBy.value = 'createTime';
  sortOrder.value = 'desc';
  pagination.value.page = 1;
  loadPets();
}

// 切換頁面
function goToPage(page) {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page;
    loadPets();
    // 滾動到頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// 格式化寵物標題
function formatPetTitle(pet) {
  const parts = [pet.name];
  if (pet.breed) parts.push(pet.breed);
  if (pet.age !== null && pet.age !== undefined) {
    parts.push(`${pet.age} 歲`);
  }
  return parts.join(' · ');
}

// 取得種類樣式類別
function getSpeciesClass(species) {
  const classMap = {
    dog: 'dog',
    cat: 'cat',
    other: 'other'
  };
  return classMap[species] || 'other';
}

onMounted(() => {
  loadPets();
});
</script>

<style scoped>
.filter-page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 24px 12px 64px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #111827;
  margin: 0 0 8px;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0;
}

.filter-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  transition: border-color 0.2s;
}

.filter-group select:hover {
  border-color: #16a085;
}

.filter-group select:focus {
  outline: none;
  border-color: #16a085;
  box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.1);
}

.filter-actions {
  display: flex;
  justify-content: end;
  gap: 12px;
  padding-top: 16px;
}

.btn-filter-apply,
.btn-reset {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
  border: 1px solid;
}

.btn-filter-apply {
  background: #16a085;
  color: #ffffff;
  border-color: #16a085;
}

.btn-filter-apply:hover {
  background: #13866f;
  border-color: #13866f;
}

.btn-reset {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.btn-reset:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.sort-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sort-controls label {
  font-size: 0.95rem;
  color: #374151;
  font-weight: 500;
}

.sort-controls select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #ffffff;
  color: #111827;
  cursor: pointer;
}

.result-count {
  font-size: 0.95rem;
  color: #6b7280;
}

.result-count strong {
  color: #16a085;
  font-weight: 600;
}

.loading-message,
.error-message,
.empty-message {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.error-message {
  color: #ef4444;
  background: #fee2e2;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #fca5a5;
}

.empty-message a {
  color: #16a085;
  text-decoration: none;
  cursor: pointer;
}

.empty-message a:hover {
  text-decoration: underline;
}

.results-section {
  margin-bottom: 32px;
}

.pet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.pet-card-list {
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.pet-card-list:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.pet-photo {
  height: 200px;
  background: linear-gradient(135deg, #f97316, #fbbf24);
  position: relative;
  overflow: hidden;
}

.pet-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pet-photo.cat {
  background: linear-gradient(135deg, #ec4899, #f97316);
}

.pet-photo.other {
  background: linear-gradient(135deg, #22c55e, #14b8a6);
}

.pet-body {
  padding: 14px 14px 12px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
}

.pet-body h3 {
  margin: 0 0 6px;
  font-size: 1rem;
  color: #111827;
}

.pet-body p {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
  flex-grow: 1;
  min-height: 40px;
}

.pet-meta {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 0.75rem;
}

.tag-green {
  background: #dcfce7;
  color: #166534;
}

.pet-actions {
  margin-top: auto;
  padding-top: 12px;
  flex-shrink: 0;
}

.btn-apply {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  background: #16a085;
  color: #ffffff;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.2s;
  width: 100%;
  height: 40px;
  box-sizing: border-box;
}

.btn-apply:hover {
  background: #13866f;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-page {
  padding: 10px 20px;
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #16a085;
  color: #16a085;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: #6b7280;
  padding: 0 12px;
}

@media (max-width: 768px) {
  .filter-row {
    grid-template-columns: 1fr;
  }

  .sort-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .pet-grid {
    grid-template-columns: 1fr;
  }

  .page-header h1 {
    font-size: 2rem;
  }
}
</style>
