// 使用者基礎類別
// 所有使用者類型（Releaser、Adopter、Admin）的基礎類別

export class User {
    constructor(userData) {
        this.userId = userData.userId || null;
        this.email = userData.email || '';
        this.password = userData.password || ''; // 僅用於註冊/登入，不儲存在 Firestore
        this.name = userData.name || '';
        this.phone = userData.phone || '';
        this.status = userData.status || 'Active'; // Active, Suspended, Inactive
        this.role = userData.role || 'User'; // User, Admin
        this.failedLoginAttempts = userData.failedLoginAttempts || 0;
        this.lockedUntil = userData.lockedUntil || null;
        this.createTime = userData.createTime || null;
        this.updateTime = userData.updateTime || null;
    }

    // 檢查帳號是否被鎖定
    isLocked() {
        if (!this.lockedUntil) {
            return false;
        }
        const now = new Date();
        const lockedUntil = this.lockedUntil.toDate ? this.lockedUntil.toDate() : new Date(this.lockedUntil);
        return now < lockedUntil;
    }

    // 檢查帳號狀態是否可用
    isActive() {
        return this.status === 'Active' && !this.isLocked();
    }

    // 增加登入失敗次數
    incrementFailedAttempts() {
        this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;

        // 如果連續失敗達 5 次，鎖定帳號 30 分鐘
        if (this.failedLoginAttempts >= 5) {
            const lockDuration = 30 * 60 * 1000; // 30 分鐘（毫秒）
            this.lockedUntil = new Date(Date.now() + lockDuration);
        }
    }

    // 重置登入失敗次數（登入成功時）
    resetFailedAttempts() {
        this.failedLoginAttempts = 0;
        this.lockedUntil = null;
    }

    // 轉換為 Firestore 格式
    toFirestore() {
        return {
            email: this.email,
            name: this.name,
            phone: this.phone,
            status: this.status,
            role: this.role,
            failedLoginAttempts: this.failedLoginAttempts,
            lockedUntil: this.lockedUntil
        };
    }

    // 從 Firestore 建立物件
    static fromFirestore(data) {
        return new User(data);
    }
}

