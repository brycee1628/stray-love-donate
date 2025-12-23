// 領養申請資料操作工具
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config.js';

// 領養申請集合
const adoptionApplicationsCollection = collection(db, 'adoptionApplications');

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

// 審核領養申請（通過或拒絕，UC-05）
export async function reviewAdoptionApplication(applicationId, action) {
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

        // 若通過審核，將對應寵物狀態改為 Adopted（已領養）
        if (action === 'approve' && applicationData.petId) {
            const petRef = doc(db, 'pets', applicationData.petId);
            await updateDoc(petRef, {
                status: 'Adopted',
                updateTime: serverTimestamp()
            });
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


