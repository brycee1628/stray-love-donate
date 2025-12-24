// 站點資料工具（UC-04）
import { ShelterSite } from '../models/ShelterSite.js';

// 站點資料（從檔案匯入的資料）
// 格式：名稱、地址、電話/Email、官方網站、Google Maps、描述
const shelterData = [
    {
        name: '台北市動物之家',
        address: '台北市內湖區潭美街852號',
        phone: '02-8791-3254',
        websiteUrl: 'https://www.tcapo.gov.taipei/Content_List.aspx?n=8A474D4AA59E06B7',
        googleMapUrl: 'https://maps.app.goo.gl/EwqHF4cjCX1tE8pr6',
        description: '台北市最大的動物收容所，提供收容、認養、醫療等服務。歡迎民眾前來認養毛孩，給牠們一個溫暖的家。',
        region: '台北市'
    },
    {
        name: '新北市板橋動物之家',
        address: '新北市板橋區板城路28-1號',
        phone: '02-8966-2158',
        websiteUrl: 'https://www.facebook.com/NTPCBanqiao/',
        googleMapUrl: 'https://maps.app.goo.gl/UYr6LWwZQJdKKsBH7',
        description: '新北市板橋區動物收容所，提供動物收容、認養服務。',
        region: '新北市'
    },
    {
        name: '新北市中和動物之家',
        address: '新北市中和區興南路三段100號',
        phone: '02-8668-5547',
        websiteUrl: 'https://www.facebook.com/profile.php?id=100066526002210',
        googleMapUrl: 'https://maps.app.goo.gl/sYhxUFRVjESW5tN9A',
        description: '新北市中和動物之家，開放時間：週二至週日 上午10點~12點 下午2點~4點',
        region: '新北市'
    },
    {
        name: '貓咪第一中途之家',
        address: '桃園市桃園區龍安街28號',
        email: 'catfirst.ty@gmail.com',
        websiteUrl: 'https://www.facebook.com/catfirst.tw/',
        googleMapUrl: 'https://maps.app.goo.gl/MPZrzbs51DfN1Fo1A',
        description: '主要協助桃園地區的貓咪中途。協助需要中途的貓咪、需要送養的貓咪、緊急醫療。',
        region: '桃園市'
    },
    {
        name: '新竹市動物保護教育園區',
        address: '新竹市南寮里海濱路192號',
        phone: '03-551-9548',
        websiteUrl: 'https://www.facebook.com/profile.php?id=100066627786621',
        googleMapUrl: 'https://maps.app.goo.gl/STcdBCgGXjpussoR8',
        description: '與新竹市動物保護協會合作，提供動物收容、認養服務。',
        region: '新竹市'
    },
    {
        name: '台中市動物之家',
        address: '台中市南屯區中台路601號',
        phone: '04-2385-0976',
        websiteUrl: 'https://www.animal.taichung.gov.tw/1521449/Normalnodelist',
        googleMapUrl: 'https://maps.app.goo.gl/XgcLGJoYw4pYByxM7',
        description: '以認養代替購買，讓愛不再流浪。',
        region: '台中市'
    },
    {
        name: '彰化縣流浪狗中途之家',
        address: '彰化縣和美鎮東萊路426號',
        phone: '04-859-0638',
        websiteUrl: 'https://www.facebook.com/DogcatFan',
        googleMapUrl: 'https://maps.app.goo.gl/r1fEC5v4pV2NXqyAA',
        description: '協助救援流浪貓狗、協助送養、協助緊急醫療。',
        region: '彰化縣'
    },
    {
        name: '嘉義市動物保護教育園區',
        address: '嘉義市彌陀路31號',
        phone: '05-216-8661',
        websiteUrl: 'https://ccap.chiayi.gov.tw/',
        googleMapUrl: 'https://maps.app.goo.gl/2nNwoPb8jL58oGQD7',
        description: '提供動物收容、認養服務，歡迎民眾前來認養。',
        region: '嘉義市'
    },
    {
        name: '台南市動物之家',
        address: '台南市南區萬年路一段1~19號',
        phone: '06-583-2399',
        websiteUrl: 'https://ahipo.tainan.gov.tw/',
        googleMapUrl: 'https://maps.app.goo.gl/ZCE9zAD3dotfXV8q8',
        description: '民國89年1月29日台南市政府成立台南市動物收容所，下設收容組、動物保護組、防疫檢疫組。',
        region: '台南市'
    },
    {
        name: '高雄市動物保護處',
        address: '高雄市鳳山區鳳頂路98號',
        phone: '07-605-1002',
        websiteUrl: 'https://livestock.kcg.gov.tw/Pets/DongwuShourong/YuanquJieshao/YuanquJieshao02.ht',
        googleMapUrl: 'https://maps.app.goo.gl/ohGaACbCKsSX8he67',
        description: '提供動物收容、認養、醫療等服務。',
        region: '高雄市'
    },
    {
        name: '宜蘭縣流浪動物中途之家',
        address: '宜蘭縣五結鄉成興村利寶路60號',
        phone: '03-960-2350',
        websiteUrl: '',
        googleMapUrl: 'https://maps.app.goo.gl/817gw15Rg72QA4W46',
        description: '週一至週日開放（週三休館）（開放時間10:00-16:00 國定假日）',
        region: '宜蘭縣'
    }
];

// 關鍵字合法性檢查（過濾不當字詞）
const forbiddenKeywords = [
    '買賣', '販售', '出售', '販賣', '交易', '價格', '多少錢', '售價',
    '購買', '買', '賣', '販', '售', '價', '錢'
];

function isValidKeyword(keyword) {
    if (!keyword || keyword.trim().length === 0) {
        return true; // 空關鍵字視為合法（用於瀏覽所有）
    }

    const lowerKeyword = keyword.toLowerCase();
    return !forbiddenKeywords.some(forbidden => lowerKeyword.includes(forbidden));
}

// 取得所有站點（序列圖 4.4：getInfo() 方法）
export function getAllShelterSites() {
    return shelterData.map((data, index) => {
        return new ShelterSite({
            siteId: `site_${index + 1}`,
            ...data
        });
    });
}

// 搜尋站點（支援關鍵字和地區搜尋）
export function searchShelterSites(keyword = '', region = '') {
    // 關鍵字合法性檢查
    if (keyword && !isValidKeyword(keyword)) {
        return {
            success: false,
            message: '搜尋關鍵字包含不當字詞，請重新輸入',
            sites: []
        };
    }

    let sites = getAllShelterSites();

    // 地區篩選
    if (region && region !== 'all') {
        sites = sites.filter(site => {
            const siteRegion = site.getInfo().region || '';
            return siteRegion.includes(region) || site.getInfo().address.includes(region);
        });
    }

    // 關鍵字搜尋（搜尋名稱、地址、描述）
    if (keyword && keyword.trim()) {
        const searchTerm = keyword.trim().toLowerCase();
        sites = sites.filter(site => {
            const info = site.getInfo();
            return (
                info.name.toLowerCase().includes(searchTerm) ||
                info.address.toLowerCase().includes(searchTerm) ||
                info.description.toLowerCase().includes(searchTerm) ||
                (info.phone && info.phone.includes(searchTerm))
            );
        });
    }

    return {
        success: true,
        sites: sites,
        count: sites.length
    };
}

// 驗證關鍵字
export function validateKeyword(keyword) {
    return isValidKeyword(keyword);
}

