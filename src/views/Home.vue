<template>
  <div class="home">
    <!-- Hero 區 -->
    <section class="hero">
      <div class="hero-content">
        <p class="hero-tag">讓愛不再流浪</p>
        <h1>浪愛歸巢</h1>
        <p class="hero-subtitle">串連送養人與領養人，打造安全透明的寵物領養平台</p>
        <div class="hero-actions">
          <router-link to="/filter" class="btn primary">我要找毛孩</router-link>
          <router-link to="/pet-upload" class="btn ghost">我要送養</router-link>
        </div>
        <p class="hero-note">目前已媒合超過 <span>120+</span> 隻毛孩找到新家</p>
      </div>
      <div class="hero-illustration">
        <!-- 主要寵物卡片 -->
        <div v-if="heroPets[0]" class="pet-card main">
          <div class="pet-avatar" :class="getSpeciesClass(heroPets[0].species)">
            <img v-if="heroPets[0].mainPhoto" :src="heroPets[0].mainPhoto" :alt="heroPets[0].name" />
          </div>
          <div class="pet-info">
            <h3>{{ formatPetTitle(heroPets[0]) }}</h3>
            <p>{{ heroPets[0].description || '等待一個溫暖的家' }}</p>
            <div class="pet-info-actions">
              <span class="tag tag-green">待領養</span>
              <router-link :to="`/adoption/${heroPets[0].id}`" class="hero-apply-link">申請領養</router-link>
            </div>
          </div>
        </div>
        <!-- 次要寵物卡片 -->
        <div v-if="heroPets[1]" class="pet-card secondary">
          <div class="pet-avatar" :class="getSpeciesClass(heroPets[1].species)">
            <img v-if="heroPets[1].mainPhoto" :src="heroPets[1].mainPhoto" :alt="heroPets[1].name" />
          </div>
          <div class="pet-info">
            <h4>{{ formatPetTitle(heroPets[1]) }}</h4>
            <div class="pet-info-actions">
              <span v-if="heroPets[1].isNeutered" class="tag">已結紮</span>
              <span v-else-if="heroPets[1].isVaccinated" class="tag">疫苗齊全</span>
              <router-link :to="`/adoption/${heroPets[1].id}`" class="hero-apply-link">申請</router-link>
            </div>
          </div>
        </div>
        <!-- 沒有資料時的預設顯示 -->
        <template v-if="!loading && heroPets.length === 0">
          <div class="pet-card main">
            <div class="pet-avatar dog"></div>
            <div class="pet-info">
              <h3>等待上架</h3>
              <p>還沒有待領養的毛孩</p>
              <span class="tag">即將上架</span>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- 平台特色 -->
    <section class="section">
      <h2 class="section-title">為什麼選擇浪愛歸巢？</h2>
      <div class="features">
        <div class="feature-card">
          <div class="icon-circle">✓</div>
          <h3>標準化領養流程</h3>
          <p>從送養刊登、表單審核到媒合完成，全程有清楚的流程與紀錄，減少誤會與溝通成本。</p>
        </div>
        <div class="feature-card">
          <div class="icon-circle">📍</div>
          <h3>地圖找附近的毛孩</h3>
          <p>透過 GPS 與服務據點設計，協助你找到離家最近、最適合的領養機會。</p>
        </div>
        <div class="feature-card">
          <div class="icon-circle">🔐</div>
          <h3>實名與資料審核</h3>
          <p>送養人與領養人皆需通過基本驗證，降低乘養與退養風險，保障雙方與毛孩的權益。</p>
        </div>
      </div>
    </section>

    <!-- 三步驟開始領養 -->
    <section class="section section-alt">
      <h2 class="section-title">三步驟，開始你的領養旅程</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <h3>瀏覽與條件篩選</h3>
          <p>在「條件篩選」中依照品種、年齡、體型與地區，找到和你生活型態最匹配的毛孩。</p>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <h3>送出領養申請</h3>
          <p>登入後填寫領養問卷，讓送養人了解你的生活環境與照顧計畫，提升媒合成功率。</p>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <h3>面談與正式領養</h3>
          <p>雙方約定見面、家訪或試養，確認彼此期待無誤後，完成領養合約與後續追蹤。</p>
        </div>
      </div>
    </section>

    <!-- 精選待領養毛孩 -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">精選待領養毛孩</h2>
        <router-link to="/filter" class="link-more">查看更多毛孩 ></router-link>
      </div>

      <!-- 載入中 -->
      <div v-if="loading" class="loading-message">
        載入中...
      </div>

      <!-- 錯誤訊息 -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- 寵物列表 -->
      <div v-if="!loading && !error" class="pet-grid">
        <article v-for="pet in featuredPets" :key="pet.id" class="pet-card-list">
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

        <!-- 沒有資料 -->
        <div v-if="featuredPets.length === 0" class="empty-message">
          <p>目前還沒有待領養的毛孩，<router-link to="/pet-upload">成為第一個上架的人</router-link>！</p>
        </div>
      </div>
    </section>


  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAllPets, getPetPhotos } from '../utils/pets.js';

const featuredPets = ref([]);
const heroPets = ref([]); // Hero 區塊顯示的寵物（前 2 隻）
const loading = ref(true);
const error = ref('');

// 隨機選擇陣列中的元素
function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// 載入精選寵物
async function loadFeaturedPets() {
  loading.value = true;
  error.value = '';

  try {
    // 載入所有寵物（不限制數量）
    const result = await getAllPets(1000); // 設定一個很大的數字以獲取所有寵物

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

      // 隨機選擇 2 隻給 hero 區塊
      if (petsWithPhotos.length >= 2) {
        heroPets.value = getRandomItems(petsWithPhotos, 2);
      } else {
        heroPets.value = petsWithPhotos;
      }

      // 所有寵物都顯示在精選區塊
      featuredPets.value = petsWithPhotos;
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
  loadFeaturedPets();
});
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 64px;
  padding: 24px 12px 64px;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  align-items: center;
  gap: 40px;
}

.hero-content h1 {
  font-size: 3rem;
  letter-spacing: 0.1em;
  margin: 8px 0 12px;
  color: #1f2933;
}

.hero-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: #e6f6f3;
  color: #0f766e;
  font-size: 0.9rem;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: #4b5563;
  max-width: 30rem;
}

.hero-actions {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-note {
  margin-top: 16px;
  font-size: 0.9rem;
  color: #6b7280;
}

.hero-note span {
  color: #0f766e;
  font-weight: 600;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;
}

.btn.primary {
  background: #16a085;
  color: #ffffff;
}

.btn.primary:hover {
  background: #13866f;
}

.btn.ghost {
  border: 1px solid #cbd5e1;
  color: #0f172a;
  background: #ffffff;
}

.btn.ghost:hover {
  background: #f9fafb;
}

.hero-illustration {
  position: relative;
  min-height: 220px;
}

.pet-card {
  position: absolute;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.15);
  padding: 16px;
  display: flex;
  gap: 14px;
  align-items: center;
}

.pet-card.main {
  top: 0;
  right: 0;
  width: 260px;
}

.pet-card.secondary {
  bottom: 0;
  left: 12%;
  width: 210px;
}

.pet-avatar {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(135deg, #f97316, #fbbf24);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.pet-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pet-avatar.dog::before,
.pet-avatar.cat::before,
.pet-avatar.other::before {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 14px;
  background: #fefce8;
  z-index: 1;
}

.pet-avatar.dog img,
.pet-avatar.cat img,
.pet-avatar.other img {
  position: relative;
  z-index: 2;
}

.pet-avatar.cat {
  background: linear-gradient(135deg, #ec4899, #f97316);
}

.pet-avatar.other {
  background: linear-gradient(135deg, #22c55e, #14b8a6);
}

.pet-info h3 {
  font-size: 1rem;
  margin: 0 0 4px;
  color: #111827;
}

.pet-info h4 {
  font-size: 0.95rem;
  margin: 0 0 4px;
  color: #111827;
}

.pet-info p {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.pet-info-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.hero-apply-link {
  font-size: 0.75rem;
  color: #16a085;
  text-decoration: none;
  font-weight: 500;
}

.hero-apply-link:hover {
  text-decoration: underline;
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

.section {
  padding: 8px 0;
}

.section-alt {
  background: #f9fafb;
  border-radius: 24px;
  padding: 32px 20px;
}

.section-title {
  font-size: 1.6rem;
  margin-bottom: 24px;
  color: #111827;
}

.features {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.feature-card {
  padding: 20px;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.feature-card h3 {
  margin: 12px 0 8px;
  font-size: 1.1rem;
}

.feature-card p {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.step {
  padding: 18px 16px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #16a085;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.step h3 {
  margin: 0 0 6px;
  font-size: 1rem;
}

.step p {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.link-more {
  font-size: 0.9rem;
  color: #0f766e;
  text-decoration: none;
}

.link-more:hover {
  text-decoration: underline;
}

.pet-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.pet-card-list {
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  background: #ffffff;
  display: flex;
  flex-direction: column;
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
}

.empty-message a:hover {
  text-decoration: underline;
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

.pet-actions {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
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

.pet-info-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.hero-apply-link {
  font-size: 0.75rem;
  color: #16a085;
  text-decoration: none;
  font-weight: 500;
}

.hero-apply-link:hover {
  text-decoration: underline;
}

.donate-call {
  margin-top: 8px;
}

.donate-box {
  border-radius: 24px;
  background: linear-gradient(135deg, #0f766e, #22c55e);
  padding: 24px 20px;
  color: #ecfdf5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.donate-box h2 {
  margin: 0 0 6px;
  font-size: 1.4rem;
}

.donate-box p {
  margin: 0;
  font-size: 0.95rem;
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-illustration {
    order: -1;
  }

  .features,
  .steps,
  .pet-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .home {
    padding-inline: 8px;
  }

  .features,
  .steps,
  .pet-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-content h1 {
    font-size: 2.2rem;
  }
}
</style>
