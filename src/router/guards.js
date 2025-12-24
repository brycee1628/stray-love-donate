// 路由守衛
import { getCurrentUser, getUserById } from '../utils/auth.js';

// 檢查使用者是否已登入
export async function requireAuth(to, from, next) {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        // 未登入，導向登入頁
        next({ name: 'Login', query: { redirect: to.fullPath } });
    } else {
        // 已登入，檢查權限
        const userResult = await getUserById(currentUser.uid);
        if (userResult.success) {
            const user = userResult.user;

            // 檢查帳號狀態
            if (user.status === 'Suspended') {
                next({ name: 'Login', query: { error: '帳號已被停權' } });
                return;
            }

            if (user.status === 'Inactive') {
                next({ name: 'Login', query: { error: '帳號尚未啟用' } });
                return;
            }
        }

        next();
    }
}

// 檢查使用者是否為管理員（UC-06：加強 Session 有效性檢查）
export async function requireAdmin(to, from, next) {
    const currentUser = getCurrentUser();

    // 檢查 1：是否有登入（Session 有效性檢查）
    if (!currentUser) {
        next({ name: 'Login', query: { redirect: to.fullPath } });
        return;
    }

    // 檢查 2：驗證 Firebase Auth Session 是否有效
    // Firebase Auth 會自動處理 token 過期，但如果 currentUser 為 null 表示 session 無效
    try {
        // 重新取得使用者資料以確認 Session 有效性
        const userResult = await getUserById(currentUser.uid);

        if (!userResult.success) {
            // 找不到使用者資料，Session 可能無效
            next({ name: 'Login', query: { redirect: to.fullPath, error: 'Session 已失效，請重新登入' } });
            return;
        }

        const user = userResult.user;

        // 檢查 3：帳號狀態檢查
        if (user.status === 'Suspended') {
            next({ name: 'Login', query: { error: '帳號已被停權' } });
            return;
        }

        if (user.status === 'Inactive') {
            next({ name: 'Login', query: { error: '帳號尚未啟用' } });
            return;
        }

        // 檢查 4：管理員權限檢查
        if (user.role !== 'Admin') {
            // 不是管理員，導向首頁
            next({ name: 'Home', query: { error: '權限不足，僅管理員可存取後台' } });
            return;
        }

        // 所有檢查通過，允許進入
        next();
    } catch (error) {
        console.error('管理員權限檢查失敗:', error);
        next({ name: 'Login', query: { redirect: to.fullPath, error: 'Session 驗證失敗，請重新登入' } });
    }
}

// 如果已登入，導向首頁（用於登入頁）
export function redirectIfAuthenticated(to, from, next) {
    const currentUser = getCurrentUser();

    if (currentUser) {
        next({ name: 'Home' });
    } else {
        next();
    }
}

