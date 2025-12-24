// 合作站點類別（UC-04）
// 根據序列圖 4.4：參與者呼叫 ShelterSite 物件的 getInfo() 方法取得站點列表
// 當參與者欲查看地圖時，呼叫 openMap() 方法

export class ShelterSite {
    constructor(siteData) {
        this.siteId = siteData.siteId || null;
        this.name = siteData.name || ''; // 站點名稱
        this.address = siteData.address || ''; // 地址
        this.phone = siteData.phone || ''; // 電話
        this.email = siteData.email || ''; // Email（可選）
        this.websiteUrl = siteData.websiteUrl || ''; // 官方網站 URL
        this.googleMapUrl = siteData.googleMapUrl || ''; // Google Maps URL
        this.description = siteData.description || ''; // 描述
        this.region = siteData.region || ''; // 地區（用於搜尋）
    }

    // 取得站點資訊（序列圖 4.4：getInfo() 方法）
    getInfo() {
        return {
            siteId: this.siteId,
            name: this.name,
            address: this.address,
            phone: this.phone,
            email: this.email,
            websiteUrl: this.websiteUrl,
            googleMapUrl: this.googleMapUrl,
            description: this.description,
            region: this.region
        };
    }

    // 開啟地圖（序列圖 4.4：openMap() 方法）
    // ShelterSite 物件讀取內部的 googleMapUrl 屬性，並觸發開啟外部地圖頁面的動作
    openMap() {
        if (this.googleMapUrl) {
            window.open(this.googleMapUrl, '_blank', 'noopener,noreferrer');
            return true;
        }
        return false;
    }

    // 開啟官方網站
    openWebsite() {
        if (this.websiteUrl) {
            window.open(this.websiteUrl, '_blank', 'noopener,noreferrer');
            return true;
        }
        return false;
    }

    // 檢查是否有地圖連結
    hasMapUrl() {
        return !!this.googleMapUrl;
    }

    // 檢查是否有官方網站連結
    hasWebsiteUrl() {
        return !!this.websiteUrl;
    }
}

