// 輸入驗證工具

// 禁止的關鍵字（買賣相關）
const FORBIDDEN_KEYWORDS = [
    '出售', '販賣', '賣', '買', '購買', '售', '販售',
    '價格', '價錢', '費用', '元', '塊', '錢',
    '交易', '轉讓', '轉售', '轉賣'
];

// 檢查是否包含禁止關鍵字
export function containsForbiddenKeywords(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }

    const lowerText = text.toLowerCase();
    return FORBIDDEN_KEYWORDS.some(keyword =>
        lowerText.includes(keyword.toLowerCase())
    );
}

// 驗證寵物資料
export function validatePetData(petData) {
    const errors = [];

    // 檢查名稱
    if (!petData.name || !petData.name.trim()) {
        errors.push('請輸入寵物名稱');
    } else if (containsForbiddenKeywords(petData.name)) {
        errors.push('寵物名稱包含禁止使用的關鍵字');
    }

    // 檢查描述
    if (!petData.description || !petData.description.trim()) {
        errors.push('請輸入寵物描述');
    } else if (containsForbiddenKeywords(petData.description)) {
        errors.push('寵物描述包含禁止使用的關鍵字（如：買賣、價格等）');
    }

    // 檢查品種（如果填寫）
    if (petData.breed && containsForbiddenKeywords(petData.breed)) {
        errors.push('品種欄位包含禁止使用的關鍵字');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

