// 領養申請資料操作工具
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config.js';

// 領養申請集合
const adoptionApplicationsCollection = collection(db, 'adoptionApplications');
// 通知集合
const notificationsCollection = collection(db, 'notifications');

// 取得管理員的未讀通知數量
export async function getAdminUnreadNotificationCount() {
    try {
        const q = query(
            notificationsCollection,
            where('recipientRole', '==', 'Admin'),
            where('read', '==', false)
        );
        const querySnapshot = await getDocs(q);
        return {
            success: true,
            count: querySnapshot.size
        };
    } catch (error) {
        console.error('取得通知數量失敗:', error);
        return {
            success: false,
            count: 0
        };
    }
}

// 取得使用者的所有通知（包括已讀和未讀）
export async function getUserAllNotifications(userId) {
    try {
        if (!userId) {
            return {
                success: true,
                notifications: []
            };
        }

        // 先嘗試使用 where + orderBy 查詢
        try {
            const q = query(
                notificationsCollection,
                where('recipientId', '==', userId),
                orderBy('createTime', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const notifications = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return {
                success: true,
                notifications: notifications
            };
        } catch (queryError) {
            // 如果查詢失敗（可能是因為沒有索引），改用客戶端過濾
            console.warn('使用 where 查詢通知失敗，改用客戶端過濾:', queryError);
            const allQuery = query(
                notificationsCollection,
                orderBy('createTime', 'desc')
            );
            const allSnapshot = await getDocs(allQuery);
            let notifications = allSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // 客戶端過濾
            notifications = notifications.filter(notif => notif.recipientId === userId);

            return {
                success: true,
                notifications: notifications
            };
        }
    } catch (error) {
        console.error('取得通知失敗:', error);
        return {
            success: false,
            message: `取得通知失敗: ${error.message}`,
            notifications: []
        };
    }
}

// 取得使用者的未讀通知
export async function getUserNotifications(userId) {
    try {
        if (!userId) {
            return {
                success: true,
                notifications: []
            };
        }

        // 先嘗試使用 where + orderBy 查詢
        try {
            const q = query(
                notificationsCollection,
                where('recipientId', '==', userId),
                where('read', '==', false),
                orderBy('createTime', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const notifications = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return {
                success: true,
                notifications: notifications
            };
        } catch (queryError) {
            // 如果查詢失敗（可能是因為沒有索引），改用客戶端過濾
            console.warn('使用 where 查詢通知失敗，改用客戶端過濾:', queryError);
            const allQuery = query(
                notificationsCollection,
                orderBy('createTime', 'desc')
            );
            const allSnapshot = await getDocs(allQuery);
            let notifications = allSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // 客戶端過濾
            notifications = notifications.filter(notif =>
                notif.recipientId === userId && notif.read === false
            );

            return {
                success: true,
                notifications: notifications
            };
        }
    } catch (error) {
        console.error('取得通知失敗:', error);
        return {
            success: false,
            notifications: []
        };
    }
}

// 檢查寵物是否可申請（防止 Race Condition）
export async function isPetAvailable(petId) {
    try {
        // 檢查寵物狀態
        const petRef = doc(db, 'pets', petId);
        const petSnap = await getDoc(petRef);

        if (!petSnap.exists()) {
            return {
                available: false,
                message: '寵物不存在'
            };
        }

        const petData = petSnap.data();

        // 檢查寵物狀態是否為 Available（待領養）
        if (petData.status !== 'Available') {
            return {
                available: false,
                message: `寵物目前狀態為：${petData.status}，無法申請領養`
            };
        }

        return {
            available: true,
            petData: { id: petSnap.id, ...petData }
        };
    } catch (error) {
        console.error('檢查寵物狀態失敗:', error);
        return {
            available: false,
            message: `檢查失敗: ${error.message}`
        };
    }
}

// 建立領養申請
export async function createAdoptionApplication(applicationData) {
    try {
        // 先檢查寵物是否可申請
        const availabilityCheck = await isPetAvailable(applicationData.petId);

        if (!availabilityCheck.available) {
            return {
                success: false,
                message: availabilityCheck.message
            };
        }

        // 建立申請記錄
        const docRef = await addDoc(adoptionApplicationsCollection, {
            ...applicationData,
            status: 'Pending', // 待審核
            createTime: serverTimestamp(),
            updateTime: serverTimestamp()
        });

        // 自動觸發通知給管理員（UC-05）
        try {
            await addDoc(notificationsCollection, {
                type: 'adoption_pending',
                recipientRole: 'Admin', // 通知所有管理員
                applicationId: docRef.id,
                petId: applicationData.petId,
                applicantName: applicationData.applicantName,
                message: `新的領養申請待審核：${applicationData.applicantName}`,
                read: false,
                createTime: serverTimestamp()
            });
        } catch (notifyError) {
            // 通知失敗不影響申請建立
            console.warn('建立通知失敗:', notifyError);
        }

        return {
            success: true,
            id: docRef.id,
            message: '領養申請已成功提交！等待管理員審核。'
        };
    } catch (error) {
        console.error('建立領養申請失敗:', error);
        return {
            success: false,
            message: `提交失敗: ${error.message}`,
            error: error
        };
    }
}

// 取得申請人的所有申請
export async function getApplicationsByAdopterId(adopterId) {
    try {
        const q = query(
            adoptionApplicationsCollection,
            where('adopterId', '==', adopterId)
        );
        const querySnapshot = await getDocs(q);
        const applications = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return {
            success: true,
            applications: applications
        };
    } catch (error) {
        console.error('取得申請列表失敗:', error);
        return {
            success: false,
            message: `取得申請列表失敗: ${error.message}`,
            error: error
        };
    }
}

// 取得特定寵物的所有申請
export async function getApplicationsByPetId(petId) {
    try {
        const q = query(
            adoptionApplicationsCollection,
            where('petId', '==', petId)
        );
        const querySnapshot = await getDocs(q);
        const applications = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return {
            success: true,
            applications: applications
        };
    } catch (error) {
        console.error('取得申請列表失敗:', error);
        return {
            success: false,
            message: `取得申請列表失敗: ${error.message}`,
            error: error
        };
    }
}

// 取得所有待審核的領養申請（管理員用，UC-05）
export async function getPendingAdoptionApplications() {
    try {
        // 優先嘗試使用 where + orderBy 查詢
        try {
            const q = query(
                adoptionApplicationsCollection,
                where('status', '==', 'Pending'),
                orderBy('createTime', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const applications = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return {
                success: true,
                applications
            };
        } catch (queryError) {
            console.warn('使用 where 查詢待審核領養申請失敗，改為客戶端過濾:', queryError);
            // 如果查詢失敗（例如缺少索引），則取得全部資料並在客戶端過濾
            const querySnapshot = await getDocs(adoptionApplicationsCollection);
            let applications = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // 僅保留狀態為 Pending 的申請
            applications = applications.filter(app => app.status === 'Pending');

            // 依 createTime 由新到舊排序
            if (applications.length > 0 && applications[0].createTime) {
                applications.sort((a, b) => {
                    const timeA = a.createTime?.toMillis ? a.createTime.toMillis() : (a.createTime?.seconds || 0) * 1000;
                    const timeB = b.createTime?.toMillis ? b.createTime.toMillis() : (b.createTime?.seconds || 0) * 1000;
                    return timeB - timeA;
                });
            }

            return {
                success: true,
                applications
            };
        }
    } catch (error) {
        console.error('取得待審核領養申請失敗:', error);
        return {
            success: false,
            message: `取得待審核領養申請失敗: ${error.message}`,
            error: error
        };
    }
}

// 審核領養申請（通過或拒絕，UC-05、UC-06：記錄稽核軌跡）
export async function reviewAdoptionApplication(applicationId, action, adminInfo = null, reason = null) {
    try {
        const applicationRef = doc(db, 'adoptionApplications', applicationId);
        const applicationSnap = await getDoc(applicationRef);

        if (!applicationSnap.exists()) {
            return {
                success: false,
                message: '找不到領養申請資料'
            };
        }

        const applicationData = applicationSnap.data();
        const previousStatus = applicationData.status;

        // 確保 adopterId 存在
        if (!applicationData.adopterId) {
            console.warn('申請資料中缺少 adopterId:', applicationData);
        }

        let newStatus;
        if (action === 'approve') {
            newStatus = 'Approved'; // 通過
        } else if (action === 'reject') {
            newStatus = 'Rejected'; // 拒絕
        } else {
            return {
                success: false,
                message: '無效的審核動作'
            };
        }

        // 更新領養申請狀態
        await updateDoc(applicationRef, {
            status: newStatus,
            updateTime: serverTimestamp()
        });

        let petPreviousStatus = null;
        // 若通過審核，將對應寵物狀態改為 Adopted（已領養）
        if (action === 'approve' && applicationData.petId) {
            const petRef = doc(db, 'pets', applicationData.petId);
            const petSnap = await getDoc(petRef);
            if (petSnap.exists()) {
                petPreviousStatus = petSnap.data().status;
                await updateDoc(petRef, {
                    status: 'Adopted',
                    updateTime: serverTimestamp()
                });
            }
        }

        // 記錄稽核軌跡（UC-06）
        if (adminInfo) {
            const { createAuditLog, AuditActionType } = await import('./audit.js');
            const actionType = action === 'approve' ? AuditActionType.ADOPTION_APPROVE : AuditActionType.ADOPTION_REJECT;
            await createAuditLog(actionType, {
                adminId: adminInfo.userId || adminInfo.uid,
                adminEmail: adminInfo.email,
                adminName: adminInfo.name,
                targetId: applicationId,
                targetType: 'adoption',
                action: action,
                reason: reason,
                previousStatus: previousStatus,
                newStatus: newStatus,
                metadata: {
                    petId: applicationData.petId || null,
                    applicantName: applicationData.applicantName || null,
                    petPreviousStatus: petPreviousStatus,
                    petNewStatus: action === 'approve' ? 'Adopted' : null
                }
            });
        }

        // 標記管理員的相關通知為已讀（審核完成後）
        try {
            const notificationQuery = query(
                notificationsCollection,
                where('recipientRole', '==', 'Admin'),
                where('applicationId', '==', applicationId),
                where('read', '==', false)
            );
            const notificationSnapshot = await getDocs(notificationQuery);
            const updatePromises = notificationSnapshot.docs.map(notifDoc =>
                updateDoc(notifDoc.ref, { read: true })
            );
            await Promise.all(updatePromises);
        } catch (markReadError) {
            console.warn('標記通知為已讀失敗:', markReadError);
        }

        // 雙向通知：通知申請人審核結果（UC-05）
        if (applicationData.adopterId) {
            try {
                await addDoc(notificationsCollection, {
                    type: action === 'approve' ? 'adoption_approved' : 'adoption_rejected',
                    recipientId: applicationData.adopterId, // 通知申請人
                    applicationId: applicationId,
                    petId: applicationData.petId,
                    message: action === 'approve'
                        ? `您的領養申請已通過審核！`
                        : `很抱歉，您的領養申請未通過審核。`,
                    read: false,
                    createTime: serverTimestamp()
                });
            } catch (notifyError) {
                // 通知失敗不影響審核結果
                console.warn('建立通知失敗:', notifyError);
            }
        } else {
            console.warn('無法建立通知：申請資料中缺少 adopterId', applicationData);
        }

        return {
            success: true,
            message: `領養申請已${action === 'approve' ? '通過審核' : '被拒絕'}`
        };
    } catch (error) {
        console.error('審核領養申請失敗:', error);
        return {
            success: false,
            message: `審核失敗: ${error.message}`,
            error: error
        };
    }
}

// 標記單一通知為已讀
export async function markNotificationAsRead(notificationId) {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
            read: true
        });
        return {
            success: true
        };
    } catch (error) {
        console.error('標記通知為已讀失敗:', error);
        return {
            success: false,
            message: `標記失敗: ${error.message}`
        };
    }
}

// 標記使用者的所有通知為已讀
export async function markAllNotificationsAsRead(userId) {
    try {
        if (!userId) {
            return {
                success: false,
                message: '使用者 ID 不存在'
            };
        }

        // 取得所有未讀通知
        try {
            const q = query(
                notificationsCollection,
                where('recipientId', '==', userId),
                where('read', '==', false)
            );
            const querySnapshot = await getDocs(q);
            const updatePromises = querySnapshot.docs.map(doc =>
                updateDoc(doc.ref, { read: true })
            );
            await Promise.all(updatePromises);
            return {
                success: true
            };
        } catch (queryError) {
            // 如果查詢失敗，改用客戶端過濾
            console.warn('使用 where 查詢通知失敗，改用客戶端過濾:', queryError);
            const allQuery = query(notificationsCollection);
            const allSnapshot = await getDocs(allQuery);
            const notifications = allSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(notif => notif.recipientId === userId && notif.read === false);

            const updatePromises = notifications.map(notif => {
                const notificationRef = doc(db, 'notifications', notif.id);
                return updateDoc(notificationRef, { read: true });
            });
            await Promise.all(updatePromises);
            return {
                success: true
            };
        }
    } catch (error) {
        console.error('標記全部通知為已讀失敗:', error);
        return {
            success: false,
            message: `標記失敗: ${error.message}`
        };
    }
}

