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
        <div class="pet-card main">
          <div class="pet-avatar dog"></div>
          <div class="pet-info">
            <h3>丸子 · 混種犬</h3>
            <p>親人親狗，適合有院子的家庭</p>
            <span class="tag tag-green">待領養</span>
          </div>
        </div>
        <div class="pet-card secondary">
          <div class="pet-avatar cat"></div>
          <div class="pet-info">
            <h4>豆花 · 成貓</h4>
            <span class="tag">已結紮</span>
          </div>
        </div>
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

    <!-- 精選待領養毛孩（靜態示意） -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">精選待領養毛孩</h2>
        <router-link to="/filter" class="link-more">查看更多毛孩 ></router-link>
      </div>
      <div class="pet-grid">
        <article class="pet-card-list">
          <div class="pet-photo dog"></div>
          <div class="pet-body">
            <h3>球球 · 中型犬 · 2 歲</h3>
            <p>個性穩定、已完成基本訓練，適合第一次養狗的家庭。</p>
            <div class="pet-meta">
              <span class="tag">台中西屯</span>
              <span class="tag tag-green">疫苗齊全</span>
            </div>
          </div>
        </article>
        <article class="pet-card-list">
          <div class="pet-photo cat"></div>
          <div class="pet-body">
            <h3>奶茶 · 家貓 · 1 歲</h3>
            <p>黏人小公主，適合室內安靜環境，已結紮與施打疫苗。</p>
            <div class="pet-meta">
              <span class="tag">新北板橋</span>
              <span class="tag">室內貓</span>
            </div>
          </div>
        </article>
        <article class="pet-card-list">
          <div class="pet-photo other"></div>
          <div class="pet-body">
            <h3>小乖 · 米克斯 · 6 個月</h3>
            <p>活潑好動，適合喜歡戶外活動的你，期待一起探索世界。</p>
            <div class="pet-meta">
              <span class="tag">高雄左營</span>
              <span class="tag">幼犬</span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- 呼籲捐款 -->
    <section class="section donate-call">
      <div class="donate-box">
        <div>
          <h2>沒有打算領養，也能幫助牠們一把</h2>
          <p>你的每一筆小額捐款，都能化作食物、醫療與中途資源，讓更多毛孩等到真正的家。</p>
        </div>
        <router-link to="/donate" class="btn primary">前往捐款平台</router-link>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
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
  top: 18px;
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
}

.pet-avatar.dog::before,
.pet-avatar.cat::before,
.pet-avatar.other::before {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 14px;
  background: #fefce8;
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
  height: 120px;
  background: linear-gradient(135deg, #f97316, #fbbf24);
}

.pet-photo.cat {
  background: linear-gradient(135deg, #ec4899, #f97316);
}

.pet-photo.other {
  background: linear-gradient(135deg, #22c55e, #14b8a6);
}

.pet-body {
  padding: 14px 14px 12px;
}

.pet-body h3 {
  margin: 0 0 6px;
  font-size: 1rem;
}

.pet-body p {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.pet-meta {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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

