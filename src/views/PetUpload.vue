<template>
  <div class="pet-upload">
    <div class="container">
      <h1>寵物上架</h1>
      <p class="subtitle">填寫寵物資訊，讓更多人可以找到牠</p>

      <form @submit.prevent="handleSubmit" class="pet-form">
        <!-- 基本資訊 -->
        <section class="form-section">
          <h2>基本資訊</h2>

          <div class="form-group">
            <label for="name">寵物名稱 <span class="required">*</span></label>
            <input id="name" v-model="formData.name" type="text" placeholder="例如：球球" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="species">種類 <span class="required">*</span></label>
              <select id="species" v-model="formData.species" required>
                <option value="">請選擇</option>
                <option value="dog">狗</option>
                <option value="cat">貓</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div class="form-group">
              <label for="breed">品種</label>
              <input id="breed" v-model="formData.breed" type="text" placeholder="例如：米克斯、黃金獵犬" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="age">年齡 <span class="required">*</span></label>
              <input id="age" v-model.number="formData.age" type="number" min="0" placeholder="歲" required />
            </div>

            <div class="form-group">
              <label for="gender">性別 <span class="required">*</span></label>
              <select id="gender" v-model="formData.gender" required>
                <option value="">請選擇</option>
                <option value="male">公</option>
                <option value="female">母</option>
                <option value="unknown">未知</option>
              </select>
            </div>

            <div class="form-group">
              <label for="size">體型 <span class="required">*</span></label>
              <select id="size" v-model="formData.size" required>
                <option value="">請選擇</option>
                <option value="small">小型</option>
                <option value="medium">中型</option>
                <option value="large">大型</option>
              </select>
            </div>
          </div>
        </section>

        <!-- 詳細資訊 -->
        <section class="form-section">
          <h2>詳細資訊</h2>

          <div class="form-group">
            <label for="location">所在地區 <span class="required">*</span></label>
            <input id="location" v-model="formData.location" type="text" placeholder="例如：台北市信義區" required />
          </div>

          <div class="form-group">
            <label for="description">寵物描述 <span class="required">*</span></label>
            <textarea id="description" v-model="formData.description" rows="5" placeholder="請描述寵物的個性、健康狀況、特殊需求等..."
              required></textarea>
          </div>

          <div class="form-group">
            <label>健康狀況</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="formData.isVaccinated" />
                已施打疫苗
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="formData.isNeutered" />
                已結紮
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="formData.isHealthy" />
                健康狀況良好
              </label>
            </div>
          </div>
        </section>

        <!-- 照片上傳 -->
        <section class="form-section">
          <h2>寵物照片</h2>

          <div class="form-group">
            <label for="photos">上傳照片 <span class="required">*</span></label>
            <p class="help-text">至少上傳一張照片，最多 5 張（每張不超過 10MB）</p>

            <div class="photo-upload-area">
              <input id="photos" type="file" accept="image/*" multiple @change="handlePhotoSelect" class="file-input" />
              <label for="photos" class="upload-button">
                <span>選擇照片</span>
              </label>
            </div>

            <!-- 照片預覽 -->
            <div v-if="photos.length > 0" class="photo-preview-grid">
              <div v-for="(photo, index) in photos" :key="index" class="photo-preview-item">
                <img :src="photo.preview" alt="預覽" />
                <button type="button" @click="removePhoto(index)" class="remove-photo-btn" title="移除照片">
                  ×
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 錯誤訊息 -->
        <div v-if="errors.length > 0" class="error-message">
          <ul>
            <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
          </ul>
        </div>

        <!-- 成功訊息 -->
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <!-- 提交按鈕 -->
        <div class="form-actions">
          <button type="submit" :disabled="submitting" class="btn-primary">
            {{ submitting ? '提交中...' : '提交上架' }}
          </button>
          <button type="button" @click="resetForm" class="btn-secondary">
            清除重填
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { createPet, createPetPhoto } from '../utils/pets.js';
import { uploadPetPhoto } from '../utils/storage.js';

// 表單資料
const formData = reactive({
  name: '',
  species: '',
  breed: '',
  age: null,
  gender: '',
  size: '',
  location: '',
  description: '',
  isVaccinated: false,
  isNeutered: false,
  isHealthy: false
});

// 照片
const photos = ref([]); // [{ file: File, preview: string }]

// 狀態
const errors = ref([]);
const successMessage = ref('');
const submitting = ref(false);

// 處理照片選擇
function handlePhotoSelect(event) {
  const files = Array.from(event.target.files);

  // 檢查數量限制
  if (photos.value.length + files.length > 5) {
    errors.value.push('最多只能上傳 5 張照片');
    return;
  }

  files.forEach(file => {
    // 檢查文件類型
    if (!file.type.startsWith('image/')) {
      errors.value.push(`${file.name} 不是圖片格式`);
      return;
    }

    // 檢查文件大小
    if (file.size > 10 * 1024 * 1024) {
      errors.value.push(`${file.name} 超過 10MB 限制`);
      return;
    }

    // 創建預覽
    const reader = new FileReader();
    reader.onload = (e) => {
      photos.value.push({
        file: file,
        preview: e.target.result
      });
    };
    reader.readAsDataURL(file);
  });

  // 清空 input，允許重新選擇相同文件
  event.target.value = '';
}

// 移除照片
function removePhoto(index) {
  photos.value.splice(index, 1);
}

// 驗證表單
function validateForm() {
  errors.value = [];

  if (!formData.name.trim()) {
    errors.value.push('請輸入寵物名稱');
  }

  if (!formData.species) {
    errors.value.push('請選擇寵物種類');
  }

  if (formData.age === null || formData.age < 0) {
    errors.value.push('請輸入有效的年齡');
  }

  if (!formData.gender) {
    errors.value.push('請選擇性別');
  }

  if (!formData.size) {
    errors.value.push('請選擇體型');
  }

  if (!formData.location.trim()) {
    errors.value.push('請輸入所在地區');
  }

  if (!formData.description.trim()) {
    errors.value.push('請輸入寵物描述');
  }

  if (photos.value.length === 0) {
    errors.value.push('請至少上傳一張照片');
  }

  return errors.value.length === 0;
}

// 重置表單
function resetForm() {
  Object.assign(formData, {
    name: '',
    species: '',
    breed: '',
    age: null,
    gender: '',
    size: '',
    location: '',
    description: '',
    isVaccinated: false,
    isNeutered: false,
    isHealthy: false
  });
  photos.value = [];
  errors.value = [];
  successMessage.value = '';
}

// 提交表單
async function handleSubmit() {
  errors.value = [];
  successMessage.value = '';

  if (!validateForm()) {
    return;
  }

  submitting.value = true;

  try {
    // 1. 先建立寵物資料
    const petResult = await createPet({
      name: formData.name.trim(),
      species: formData.species,
      breed: formData.breed.trim() || null,
      age: formData.age,
      gender: formData.gender,
      size: formData.size,
      location: formData.location.trim(),
      description: formData.description.trim(),
      isVaccinated: formData.isVaccinated,
      isNeutered: formData.isNeutered,
      isHealthy: formData.isHealthy,
      releaserId: null // 暫時設為 null，等登入功能完成後再改
    });

    if (!petResult.success) {
      errors.value.push(petResult.message);
      submitting.value = false;
      return;
    }

    const petId = petResult.id;

    // 2. 上傳照片
    const photoUploadResults = [];
    for (let i = 0; i < photos.value.length; i++) {
      const photo = photos.value[i];
      try {
        // 上傳到 Storage
        const uploadResult = await uploadPetPhoto(photo.file, petId, i);

        if (uploadResult.success) {
          // 建立照片記錄
          const photoRecordResult = await createPetPhoto({
            petId: petId,
            photoUrl: uploadResult.url,
            photoPath: uploadResult.path,
            order: i
          });

          if (photoRecordResult.success) {
            photoUploadResults.push({ success: true, index: i });
          } else {
            photoUploadResults.push({ success: false, index: i, error: photoRecordResult.message });
          }
        } else {
          photoUploadResults.push({ success: false, index: i, error: uploadResult.error });
        }
      } catch (error) {
        console.error(`照片 ${i + 1} 上傳失敗:`, error);
        photoUploadResults.push({ success: false, index: i, error: error.message });
      }
    }

    // 3. 檢查結果
    const successCount = photoUploadResults.filter(r => r.success).length;
    const failCount = photoUploadResults.filter(r => !r.success).length;

    if (successCount > 0) {
      successMessage.value = `寵物資料已成功提交！已上傳 ${successCount} 張照片。${failCount > 0 ? `（${failCount} 張照片上傳失敗）` : ''}`;
      resetForm();
    } else if (failCount > 0) {
      errors.value.push('寵物資料已建立，但所有照片上傳失敗。請檢查 Firebase Storage 設置。');
    } else {
      successMessage.value = '寵物資料已成功提交！';
      resetForm();
    }
  } catch (error) {
    console.error('提交失敗:', error);
    errors.value.push(`提交失敗: ${error.message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.pet-upload {
  min-height: 100vh;
  background: #f9fafb;
  padding: 40px 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

h1 {
  font-size: 2rem;
  color: #111827;
  margin: 0 0 8px;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: #6b7280;
  margin: 0 0 32px;
}

.pet-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section h2 {
  font-size: 1.25rem;
  color: #111827;
  margin: 0 0 8px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.required {
  color: #ef4444;
}

input[type="text"],
input[type="number"],
select,
textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input[type="text"]:focus,
input[type="number"]:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #16a085;
  box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.1);
}

textarea {
  resize: vertical;
  font-family: inherit;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #fca5a5;
}

.error-message ul {
  margin: 0;
  padding-left: 20px;
}

.success-message {
  background: #dcfce7;
  color: #166534;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #86efac;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 8px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #16a085;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #13866f;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.help-text {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 4px 0 12px;
}

.photo-upload-area {
  position: relative;
}

.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
}

.upload-button {
  display: inline-block;
  padding: 12px 24px;
  background: #f3f4f6;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.upload-button:hover {
  background: #e5e7eb;
  border-color: #16a085;
}

.upload-button span {
  color: #374151;
  font-weight: 500;
}

.photo-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.photo-preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.photo-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  border: none;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.remove-photo-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

@media (max-width: 640px) {
  .container {
    padding: 24px 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }

  .photo-preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>
