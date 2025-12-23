// 領養申請資料操作工具
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
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

