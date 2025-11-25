# 浪愛歸巢

Vue3 + Vite 寵物領養平台

## 功能頁面

-   **用例一：寵物上架** - `/pet-upload`
-   **用例二：條件篩選** - `/filter`
-   **用例三：使用者資料登入** - `/login`
-   **用例四：鄰近站點搜尋** - `/nearby`
-   **用例五：抖內平台** - `/donate`

## 安裝與執行

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建置生產版本
npm run build

# 預覽生產版本
npm run preview
```

## GitHub Pages 部署

本專案已配置自動部署到 GitHub Pages。

### 部署步驟

1. **推送代碼到 GitHub**

    ```bash
    git add .
    git commit -m "Initial commit"
    git push origin main
    ```

2. **啟用 GitHub Pages**

    - 前往 GitHub 倉庫的 Settings
    - 點擊左側的 Pages
    - 在 Source 選擇 "GitHub Actions"
    - 保存設置

3. **自動部署**
    - 當你推送代碼到 `main` 分支時，GitHub Actions 會自動構建並部署
    - 部署完成後，網站將在 `https://[你的用戶名].github.io/stray-love-donate/` 上線

### 手動觸發部署

如果需要手動觸發部署：

-   前往 GitHub 倉庫的 Actions 標籤
-   選擇 "Deploy to GitHub Pages" 工作流
-   點擊 "Run workflow" 按鈕
