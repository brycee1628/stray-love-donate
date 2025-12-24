// 寵物資料操作工具
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../firebase/config.js';

// 寵物集合
const petsCollection = collection(db, 'pets');
const petPhotosCollection = collection(db, 'petPhotos');

// 建立寵物資料
export async function createPet(petData) {
    try {
        const docRef = await addDoc(petsCollection, {
            ...petData,
            status: 'PendingReview', // 待審核
            createTime: serverTimestamp(),
            updateTime: serverTimestamp()
        });
        return {
            success: true,
            id: docRef.id,
            message: '寵物資料建立成功！'
        };
    } catch (error) {
        console.error('建立寵物資料失敗:', error);
        return {
            success: false,
            message: `建立失敗: ${error.message}`,
            error: error
        };
    }
}

// 根據 ID 取得單一寵物
export async function getPetById(petId) {
    try {
        const { doc, getDoc } = await import('firebase/firestore');
        const petRef = doc(db, 'pets', petId);
        const petSnap = await getDoc(petRef);

        if (petSnap.exists()) {
            return {
                success: true,
                pet: {
                    id: petSnap.id,
                    ...petSnap.data()
                }
            };
        }
        return {
            success: false,
            message: '找不到寵物資料'
        };
    } catch (error) {
        console.error('取得寵物資料失敗:', error);
        return {
            success: false,
            message: `取得寵物資料失敗: ${error.message}`,
            error: error
        };
    }
}

// 建立寵物照片記錄
export async function createPetPhoto(photoData) {
    try {
        const docRef = await addDoc(petPhotosCollection, {
            ...photoData,
            createTime: serverTimestamp()
        });
        return {
            success: true,
            id: docRef.id
        };
    } catch (error) {
        console.error('建立照片記錄失敗:', error);
        return {
            success: false,
            message: `建立照片記錄失敗: ${error.message}`,
            error: error
        };
    }
}

// 取得所有寵物（用於首頁顯示）
// limitCount: 限制數量，如果設為很大的數字（如 1000）或 undefined 則獲取所有寵物
// 根據規格書：首頁應該只顯示狀態為 'Available'（待領養）的寵物
export async function getAllPets(limitCount = 1000) {
    try {
        let querySnapshot;

        // 如果 limitCount 很大（>= 1000），則獲取所有資料
        if (limitCount >= 1000) {
            try {
                // 只取得狀態為 'Available'（待領養）的寵物
                const q = query(
                    petsCollection,
                    where('status', '==', 'Available'),
                    orderBy('createTime', 'desc')
                );
                querySnapshot = await getDocs(q);
            } catch (queryError) {
                // 如果查詢失敗（可能是因為沒有索引），則取得所有資料並在客戶端過濾
                console.warn('使用 where 查詢失敗，改為客戶端過濾:', queryError);
                try {
                    const q = query(
                        petsCollection,
                        orderBy('createTime', 'desc')
                    );
                    querySnapshot = await getDocs(q);
                } catch (orderByError) {
                    // 如果 orderBy 也失敗，則取得所有資料
                    console.warn('使用 orderBy 失敗，改為獲取所有資料:', orderByError);
                    querySnapshot = await getDocs(petsCollection);
                }
            }
        } else {
            // 限制數量時使用 limit
            try {
                // 只取得狀態為 'Available'（待領養）的寵物
                const q = query(
                    petsCollection,
                    where('status', '==', 'Available'),
                    orderBy('createTime', 'desc'),
                    limit(limitCount)
                );
                querySnapshot = await getDocs(q);
            } catch (queryError) {
                // 如果查詢失敗，則取得所有資料並在客戶端過濾和排序
                console.warn('使用 where 查詢失敗，改為客戶端過濾:', queryError);
                try {
                    const q = query(
                        petsCollection,
                        orderBy('createTime', 'desc'),
                        limit(limitCount * 2) // 多取一些，因為會過濾
                    );
                    querySnapshot = await getDocs(q);
                } catch (orderByError) {
                    console.warn('使用 orderBy 失敗，改為客戶端排序:', orderByError);
                    querySnapshot = await getDocs(petsCollection);
                }
            }
        }

        let pets = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 在客戶端過濾：只保留狀態為 'Available' 的寵物
        pets = pets.filter(pet => pet.status === 'Available');

        // 如果沒有使用 orderBy，則在客戶端排序
        if (pets.length > 0 && pets[0].createTime) {
            pets.sort((a, b) => {
                const timeA = a.createTime?.toMillis ? a.createTime.toMillis() : (a.createTime?.seconds || 0) * 1000;
                const timeB = b.createTime?.toMillis ? b.createTime.toMillis() : (b.createTime?.seconds || 0) * 1000;
                return timeB - timeA; // 降序
            });
        }

        // 只有在 limitCount < 1000 時才限制數量
        if (limitCount < 1000) {
            pets = pets.slice(0, limitCount);
        }

        return {
            success: true,
            pets: pets
        };
    } catch (error) {
        console.error('取得寵物列表失敗:', error);
        return {
            success: false,
            message: `取得寵物列表失敗: ${error.message}`,
            error: error
        };
    }
}

// 根據寵物 ID 取得照片
export async function getPetPhotos(petId) {
    try {
        // 先取得所有照片，然後在客戶端過濾和排序（避免需要建立索引）
        const querySnapshot = await getDocs(petPhotosCollection);
        const photos = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(photo => photo.petId === petId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        return {
            success: true,
            photos: photos
        };
    } catch (error) {
        console.error('取得寵物照片失敗:', error);
        return {
            success: false,
            message: `取得寵物照片失敗: ${error.message}`,
            error: error
        };
    }
}

// 取得所有待審核的寵物（管理員用）
export async function getPendingReviewPets() {
    try {
        // 嘗試使用 where 查詢
        try {
            const q = query(
                petsCollection,
                where('status', '==', 'PendingReview'),
                orderBy('createTime', 'desc')
            );
            const querySnapshot = await getDocs(q);

            const pets = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {
                success: true,
                pets: pets
            };
        } catch (queryError) {
            // 如果查詢失敗（可能是因為沒有索引），則取得所有資料並在客戶端過濾
            console.warn('使用 where 查詢失敗，改為客戶端過濾:', queryError);
            const querySnapshot = await getDocs(petsCollection);

            let pets = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // 在客戶端過濾：只保留狀態為 'PendingReview' 的寵物
            pets = pets.filter(pet => pet.status === 'PendingReview');

            // 在客戶端排序
            if (pets.length > 0 && pets[0].createTime) {
                pets.sort((a, b) => {
                    const timeA = a.createTime?.toMillis ? a.createTime.toMillis() : (a.createTime?.seconds || 0) * 1000;
                    const timeB = b.createTime?.toMillis ? b.createTime.toMillis() : (b.createTime?.seconds || 0) * 1000;
                    return timeB - timeA; // 降序
                });
            }

            return {
                success: true,
                pets: pets
            };
        }
    } catch (error) {
        console.error('取得待審核寵物失敗:', error);
        return {
            success: false,
            message: `取得待審核寵物失敗: ${error.message}`,
            error: error
        };
    }
}

// 審核寵物（通過或拒絕）
export async function reviewPet(petId, action) {
    try {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const petRef = doc(db, 'pets', petId);

        let newStatus;
        if (action === 'approve') {
            newStatus = 'Available'; // 通過，改為待領養
        } else if (action === 'reject') {
            newStatus = 'Rejected'; // 拒絕
        } else {
            return {
                success: false,
                message: '無效的審核動作'
            };
        }

        await updateDoc(petRef, {
            status: newStatus,
            updateTime: serverTimestamp()
        });

        return {
            success: true,
            message: `寵物已${action === 'approve' ? '通過審核' : '被拒絕'}`
        };
    } catch (error) {
        console.error('審核寵物失敗:', error);
        return {
            success: false,
            message: `審核失敗: ${error.message}`,
            error: error
        };
    }
}

// 條件篩選搜尋寵物（UC-04）
// filters: { species, age, gender, location }
// sortBy: 'createTime' | 'location' | 'name'
// sortOrder: 'asc' | 'desc'
// page: 頁碼（從 1 開始）
// pageSize: 每頁數量
export async function searchPets(filters = {}, sortBy = 'createTime', sortOrder = 'desc', page = 1, pageSize = 6) {
    try {
        // 先取得所有 Available 的寵物
        let querySnapshot;
        try {
            const q = query(
                petsCollection,
                where('status', '==', 'Available'),
                orderBy('createTime', 'desc')
            );
            querySnapshot = await getDocs(q);
        } catch (queryError) {
            // 如果查詢失敗（可能是因為沒有索引），則取得所有資料並在客戶端過濾
            console.warn('使用 where 查詢失敗，改為客戶端過濾:', queryError);
            try {
                const q = query(
                    petsCollection,
                    orderBy('createTime', 'desc')
                );
                querySnapshot = await getDocs(q);
            } catch (orderByError) {
                console.warn('使用 orderBy 失敗，改為獲取所有資料:', orderByError);
                querySnapshot = await getDocs(petsCollection);
            }
        }

        // 轉換為陣列
        let pets = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 客戶端過濾：只保留狀態為 'Available' 的寵物
        pets = pets.filter(pet => pet.status === 'Available');

        // 應用篩選條件
        if (filters.species && filters.species !== 'all') {
            pets = pets.filter(pet => pet.species === filters.species);
        }
        if (filters.age !== null && filters.age !== undefined && filters.age !== 'all') {
            pets = pets.filter(pet => {
                const petAge = pet.age;
                if (petAge === null || petAge === undefined) return false;
                // 支援年齡範圍篩選
                if (typeof filters.age === 'string') {
                    if (filters.age === 'young') return petAge <= 1;
                    if (filters.age === 'adult') return petAge > 1 && petAge <= 7;
                    if (filters.age === 'senior') return petAge > 7;
                }
                // 精確年齡
                return petAge === filters.age;
            });
        }
        if (filters.gender && filters.gender !== 'all') {
            pets = pets.filter(pet => pet.gender === filters.gender);
        }
        if (filters.location && filters.location !== 'all') {
            pets = pets.filter(pet => {
                // 支援部分匹配：例如選擇「台北市」可以匹配「台北市信義區」、「台北市大安區」等
                // 使用 startsWith 確保只匹配以該城市開頭的地址，避免誤匹配
                const petLocation = pet.location || '';
                return petLocation.startsWith(filters.location);
            });
        }

        // 應用排序
        pets.sort((a, b) => {
            let aValue, bValue;

            if (sortBy === 'createTime') {
                aValue = a.createTime?.toMillis ? a.createTime.toMillis() : (a.createTime?.seconds || 0) * 1000;
                bValue = b.createTime?.toMillis ? b.createTime.toMillis() : (b.createTime?.seconds || 0) * 1000;
            } else if (sortBy === 'location') {
                aValue = (a.location || '').toLowerCase();
                bValue = (b.location || '').toLowerCase();
            } else if (sortBy === 'name') {
                aValue = (a.name || '').toLowerCase();
                bValue = (b.name || '').toLowerCase();
            } else {
                // 預設使用 createTime
                aValue = a.createTime?.toMillis ? a.createTime.toMillis() : (a.createTime?.seconds || 0) * 1000;
                bValue = b.createTime?.toMillis ? b.createTime.toMillis() : (b.createTime?.seconds || 0) * 1000;
            }

            if (sortBy === 'createTime') {
                return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
            } else {
                // 字串排序
                if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            }
        });

        // 計算分頁
        const total = pets.length;
        const totalPages = Math.ceil(total / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedPets = pets.slice(startIndex, endIndex);

        return {
            success: true,
            pets: paginatedPets,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    } catch (error) {
        console.error('搜尋寵物失敗:', error);
        return {
            success: false,
            message: `搜尋失敗: ${error.message}`,
            error: error
        };
    }
}

