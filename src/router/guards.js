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

// 檢查使用者是否為管理員
export async function requireAdmin(to, from, next) {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        next({ name: 'Login', query: { redirect: to.fullPath } });
        return;
    }
    
    const userResult = await getUserById(currentUser.uid);
    if (userResult.success && userResult.user.role === 'Admin') {
        next();
    } else {
        // 不是管理員，導向首頁
        next({ name: 'Home', query: { error: '權限不足' } });
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

