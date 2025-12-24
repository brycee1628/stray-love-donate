// 使用者管理工具（UC-06）
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config.js';

const usersCollection = collection(db, 'users');

// 取得所有使用者
export async function getAllUsers() {
    try {
        const q = query(usersCollection, orderBy('createTime', 'desc'));
        const querySnapshot = await getDocs(q);

        const users = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return {
            success: true,
            users: users
        };
    } catch (error) {
        console.error('取得使用者列表失敗:', error);
        return {
            success: false,
            message: `取得使用者列表失敗: ${error.message}`,
            error: error
        };
    }
}

// 停權使用者（UC-06：記錄稽核軌跡）
export async function suspendUser(userId, adminInfo = null, reason = null) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return {
                success: false,
                message: '找不到使用者資料'
            };
        }

        const userData = userSnap.data();
        const previousStatus = userData.status;

        // 更新使用者狀態為 Suspended
        await updateDoc(userRef, {
            status: 'Suspended',
            updateTime: serverTimestamp()
        });

        // 記錄稽核軌跡
        if (adminInfo) {
            const { createAuditLog, AuditActionType } = await import('./audit.js');
            await createAuditLog(AuditActionType.USER_SUSPEND, {
                adminId: adminInfo.userId || adminInfo.uid,
                adminEmail: adminInfo.email,
                adminName: adminInfo.name,
                targetId: userId,
                targetType: 'user',
                action: 'suspend',
                reason: reason,
                previousStatus: previousStatus,
                newStatus: 'Suspended',
                metadata: {
                    userEmail: userData.email || null,
                    userName: userData.name || null
                }
            });
        }

        return {
            success: true,
            message: '使用者已停權'
        };
    } catch (error) {
        console.error('停權使用者失敗:', error);
        return {
            success: false,
            message: `停權失敗: ${error.message}`,
            error: error
        };
    }
}

// 解除停權使用者（UC-06：記錄稽核軌跡）
export async function unsuspendUser(userId, adminInfo = null, reason = null) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return {
                success: false,
                message: '找不到使用者資料'
            };
        }

        const userData = userSnap.data();
        const previousStatus = userData.status;

        // 更新使用者狀態為 Active
        await updateDoc(userRef, {
            status: 'Active',
            updateTime: serverTimestamp()
        });

        // 記錄稽核軌跡
        if (adminInfo) {
            const { createAuditLog, AuditActionType } = await import('./audit.js');
            await createAuditLog(AuditActionType.USER_UNSUSPEND, {
                adminId: adminInfo.userId || adminInfo.uid,
                adminEmail: adminInfo.email,
                adminName: adminInfo.name,
                targetId: userId,
                targetType: 'user',
                action: 'unsuspend',
                reason: reason,
                previousStatus: previousStatus,
                newStatus: 'Active',
                metadata: {
                    userEmail: userData.email || null,
                    userName: userData.name || null
                }
            });
        }

        return {
            success: true,
            message: '使用者已解除停權'
        };
    } catch (error) {
        console.error('解除停權失敗:', error);
        return {
            success: false,
            message: `解除停權失敗: ${error.message}`,
            error: error
        };
    }
}

