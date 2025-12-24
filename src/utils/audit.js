// 稽核軌跡工具（UC-06）
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase/config.js';

// 稽核記錄集合
const auditLogsCollection = collection(db, 'auditLogs');

// 操作類型
export const AuditActionType = {
    PET_REVIEW_APPROVE: 'PET_REVIEW_APPROVE',
    PET_REVIEW_REJECT: 'PET_REVIEW_REJECT',
    ADOPTION_APPROVE: 'ADOPTION_APPROVE',
    ADOPTION_REJECT: 'ADOPTION_REJECT',
    USER_SUSPEND: 'USER_SUSPEND',
    USER_UNSUSPEND: 'USER_UNSUSPEND',
    USER_DELETE: 'USER_DELETE',
    USER_UPDATE: 'USER_UPDATE'
};

// 建立稽核記錄
export async function createAuditLog(actionType, details) {
    try {
        const auditLog = {
            actionType: actionType,
            adminId: details.adminId || null,
            adminEmail: details.adminEmail || null,
            adminName: details.adminName || null,
            targetId: details.targetId || null, // 被操作的目標 ID（寵物 ID、申請 ID、使用者 ID）
            targetType: details.targetType || null, // 'pet', 'adoption', 'user'
            action: details.action || null, // 'approve', 'reject', 'suspend' 等
            reason: details.reason || null, // 操作理由
            previousStatus: details.previousStatus || null, // 操作前的狀態
            newStatus: details.newStatus || null, // 操作後的狀態
            metadata: details.metadata || {}, // 其他相關資訊
            timestamp: serverTimestamp(),
            ipAddress: details.ipAddress || null, // 可選：記錄 IP 位址
            userAgent: details.userAgent || null // 可選：記錄 User Agent
        };

        const docRef = await addDoc(auditLogsCollection, auditLog);

        return {
            success: true,
            auditLogId: docRef.id,
            message: '稽核記錄已建立'
        };
    } catch (error) {
        console.error('建立稽核記錄失敗:', error);
        return {
            success: false,
            message: `建立稽核記錄失敗: ${error.message}`,
            error: error
        };
    }
}

// 取得稽核記錄列表
export async function getAuditLogs(filters = {}, limitCount = 100) {
    try {
        let q = query(auditLogsCollection, orderBy('timestamp', 'desc'));

        // 應用篩選條件
        if (filters.actionType) {
            q = query(q, where('actionType', '==', filters.actionType));
        }
        if (filters.adminId) {
            q = query(q, where('adminId', '==', filters.adminId));
        }
        if (filters.targetId) {
            q = query(q, where('targetId', '==', filters.targetId));
        }
        if (filters.targetType) {
            q = query(q, where('targetType', '==', filters.targetType));
        }

        const querySnapshot = await getDocs(q);
        let logs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 如果查詢失敗（可能是因為沒有索引），則取得所有資料並在客戶端過濾
        if (filters.actionType && logs.length === 0) {
            try {
                const allQuery = query(auditLogsCollection, orderBy('timestamp', 'desc'));
                const allSnapshot = await getDocs(allQuery);
                logs = allSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // 客戶端過濾
                if (filters.actionType) {
                    logs = logs.filter(log => log.actionType === filters.actionType);
                }
                if (filters.adminId) {
                    logs = logs.filter(log => log.adminId === filters.adminId);
                }
                if (filters.targetId) {
                    logs = logs.filter(log => log.targetId === filters.targetId);
                }
                if (filters.targetType) {
                    logs = logs.filter(log => log.targetType === filters.targetType);
                }
            } catch (error) {
                console.warn('使用 where 查詢失敗，改為客戶端過濾:', error);
            }
        }

        // 限制數量
        if (limitCount && limitCount > 0) {
            logs = logs.slice(0, limitCount);
        }

        return {
            success: true,
            logs: logs
        };
    } catch (error) {
        console.error('取得稽核記錄失敗:', error);
        return {
            success: false,
            message: `取得稽核記錄失敗: ${error.message}`,
            error: error
        };
    }
}

