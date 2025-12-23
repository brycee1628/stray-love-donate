// 認證狀態管理 Composable
import { ref, computed } from 'vue';
import { onAuthStateChange, getCurrentUser, getUserById, logout } from '../utils/auth.js';
import { User } from '../models/User.js';

const currentUser = ref(null);
const userData = ref(null);
const loading = ref(true);

// 初始化認證狀態監聽
let unsubscribe = null;

// 監聽認證狀態變化
onAuthStateChange(async (firebaseUser) => {
    loading.value = true;
    
    if (firebaseUser) {
        currentUser.value = firebaseUser;
        
        // 取得使用者資料
        const result = await getUserById(firebaseUser.uid);
        if (result.success) {
            userData.value = result.user;
        } else {
            // 如果找不到資料，建立基本 User 物件
            userData.value = new User({
                userId: firebaseUser.uid,
                email: firebaseUser.email || '',
                status: 'Active',
                role: 'User'
            });
        }
    } else {
        currentUser.value = null;
        userData.value = null;
    }
    
    loading.value = false;
});

export function useAuth() {
    // 使用 computed 讓 isAuthenticated 成為響應式
    const isAuthenticated = computed(() => currentUser.value !== null);
    const isAdmin = computed(() => userData.value?.role === 'Admin');
    
    return {
        currentUser,
        userData,
        loading,
        isAuthenticated,
        isAdmin,
        logout: async () => {
            await logout();
            currentUser.value = null;
            userData.value = null;
        }
    };
}

