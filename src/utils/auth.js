// 使用者身份驗證工具
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config.js';
import { User } from '../models/User.js';

// 使用者集合
const usersCollection = 'users';

// 註冊新帳號（UC-01）
export async function register(email, password, userData) {
    try {
        // 必填檢查
        if (!email || !email.trim()) {
            return {
                success: false,
                message: '請輸入電子郵件'
            };
        }

        if (!password || password.length < 6) {
            return {
                success: false,
                message: '密碼長度至少需要 6 個字元'
            };
        }

        if (!userData.name || !userData.name.trim()) {
            return {
                success: false,
                message: '請輸入姓名'
            };
        }

        // 建立 Firebase Authentication 帳號
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // 建立 User 物件
        const user = new User({
            userId: firebaseUser.uid,
            email: email.trim(),
            name: userData.name.trim(),
            phone: userData.phone || '',
            status: 'Active',
            role: userData.role || 'User',
            failedLoginAttempts: 0,
            lockedUntil: null
        });

        // 儲存使用者資料到 Firestore
        const userRef = doc(db, usersCollection, firebaseUser.uid);
        await setDoc(userRef, {
            ...user.toFirestore(),
            createTime: serverTimestamp(),
            updateTime: serverTimestamp()
        });

        // 註冊後立即登出，要求用戶手動登入
        await signOut(auth);

        return {
            success: true,
            user: user,
            message: '註冊成功！請使用您的帳號密碼登入。'
        };
    } catch (error) {
        console.error('註冊失敗:', error);
        let errorMessage = '註冊失敗';

        if (error.code === 'auth/email-already-in-use') {
            errorMessage = '此電子郵件已被使用';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = '電子郵件格式不正確';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = '密碼強度不足';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return {
            success: false,
            message: errorMessage,
            error: error
        };
    }
}

// 登入（UC-01）
export async function login(email, password) {
    try {
        // 必填檢查
        if (!email || !email.trim()) {
            return {
                success: false,
                message: '請輸入電子郵件'
            };
        }

        if (!password) {
            return {
                success: false,
                message: '請輸入密碼'
            };
        }

        // 先嘗試用 email 查詢 Firestore 取得使用者資料（檢查帳號狀態和鎖定）
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const usersRef = collection(db, usersCollection);
        const emailQuery = query(usersRef, where('email', '==', email.trim()));
        const emailSnapshot = await getDocs(emailQuery);

        let userData = null;
        let userId = null;
        let userDocRef = null;

        if (!emailSnapshot.empty) {
            userDocRef = emailSnapshot.docs[0].ref;
            userData = emailSnapshot.docs[0].data();
            userId = emailSnapshot.docs[0].id;

            // 建立 User 物件並檢查狀態
            const user = new User({ ...userData, userId: userId });

            // 檢查是否被鎖定
            if (user.isLocked()) {
                const lockedUntil = user.lockedUntil.toDate ? user.lockedUntil.toDate() : new Date(user.lockedUntil);
                return {
                    success: false,
                    message: `帳號已被鎖定，請於 ${lockedUntil.toLocaleString('zh-TW')} 後再試`
                };
            }

            // 帳號狀態檢查
            if (user.status === 'Suspended') {
                return {
                    success: false,
                    message: '帳號已被停權，請聯絡管理員'
                };
            }

            if (user.status === 'Inactive') {
                return {
                    success: false,
                    message: '帳號尚未啟用，請聯絡管理員'
                };
            }
        }

        // 嘗試登入 Firebase Auth
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
            userId = userCredential.user.uid;

            // 如果 Firestore 中沒有資料，建立基本資料
            if (!userData) {
                const userRef = doc(db, usersCollection, userId);
                userData = {
                    email: email.trim(),
                    status: 'Active',
                    role: 'User',
                    failedLoginAttempts: 0,
                    lockedUntil: null
                };
                await setDoc(userRef, {
                    ...userData,
                    createTime: serverTimestamp(),
                    updateTime: serverTimestamp()
                });
                userDocRef = userRef;
            } else {
                // 如果 Firestore 中的 UID 與 Firebase Auth 的 UID 不同，更新文件
                if (userDocRef && userId !== userDocRef.id) {
                    // 建立新文件（使用 Firebase Auth 的 UID）
                    const newUserRef = doc(db, usersCollection, userId);
                    await setDoc(newUserRef, {
                        ...userData,
                        updateTime: serverTimestamp()
                    });
                    userDocRef = newUserRef;
                } else if (!userDocRef) {
                    // 如果沒有找到文件，建立新文件
                    const newUserRef = doc(db, usersCollection, userId);
                    await setDoc(newUserRef, {
                        ...userData,
                        updateTime: serverTimestamp()
                    });
                    userDocRef = newUserRef;
                }
            }
        } catch (authError) {
            // Firebase Auth 登入失敗，更新失敗次數
            if (userDocRef && userData) {
                const user = new User({ ...userData, userId: userId || userDocRef.id });
                user.incrementFailedAttempts();

                await updateDoc(userDocRef, {
                    failedLoginAttempts: user.failedLoginAttempts,
                    lockedUntil: user.lockedUntil,
                    updateTime: serverTimestamp()
                });

                // 檢查是否被鎖定
                if (user.isLocked()) {
                    const lockedUntil = user.lockedUntil.toDate ? user.lockedUntil.toDate() : new Date(user.lockedUntil);
                    return {
                        success: false,
                        message: `帳號已被鎖定，請於 ${lockedUntil.toLocaleString('zh-TW')} 後再試`
                    };
                }

                return {
                    success: false,
                    message: '電子郵件或密碼錯誤',
                    remainingAttempts: 5 - user.failedLoginAttempts
                };
            }

            return {
                success: false,
                message: '電子郵件或密碼錯誤'
            };
        }

        // 如果找不到使用者資料，建立基本資料
        if (!userData) {
            const userRef = doc(db, usersCollection, userId);
            userData = {
                email: email.trim(),
                status: 'Active',
                role: 'User',
                failedLoginAttempts: 0,
                lockedUntil: null
            };
            await setDoc(userRef, {
                ...userData,
                createTime: serverTimestamp(),
                updateTime: serverTimestamp()
            });
        }

        // 建立 User 物件
        const user = new User({ ...userData, userId: userId });

        // 登入成功，重置失敗次數
        user.resetFailedAttempts();
        if (userDocRef) {
            await updateDoc(userDocRef, {
                failedLoginAttempts: 0,
                lockedUntil: null,
                updateTime: serverTimestamp()
            });
        }

        return {
            success: true,
            user: user,
            message: '登入成功！'
        };
    } catch (error) {
        console.error('登入失敗:', error);

        // 如果是 Firebase Auth 錯誤，嘗試更新失敗次數
        if (error.code && error.code.startsWith('auth/')) {
            try {
                const { collection, query, where, getDocs } = await import('firebase/firestore');
                const usersRef = collection(db, usersCollection);
                const q = query(usersRef, where('email', '==', email.trim()));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    const userData = userDoc.data();
                    const user = new User({ ...userData, userId: userDoc.id });
                    user.incrementFailedAttempts();

                    await updateDoc(userDoc.ref, {
                        failedLoginAttempts: user.failedLoginAttempts,
                        lockedUntil: user.lockedUntil,
                        updateTime: serverTimestamp()
                    });

                    if (user.isLocked()) {
                        const lockedUntil = user.lockedUntil.toDate ? user.lockedUntil.toDate() : new Date(user.lockedUntil);
                        return {
                            success: false,
                            message: `帳號已被鎖定，請於 ${lockedUntil.toLocaleString('zh-TW')} 後再試`
                        };
                    }

                    return {
                        success: false,
                        message: '電子郵件或密碼錯誤',
                        remainingAttempts: Math.max(0, 5 - user.failedLoginAttempts)
                    };
                }
            } catch (updateError) {
                console.error('更新失敗次數失敗:', updateError);
            }
        }

        let errorMessage = '登入失敗';
        if (error.code === 'auth/user-not-found') {
            errorMessage = '找不到此帳號';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = '密碼錯誤';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = '電子郵件格式不正確';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return {
            success: false,
            message: errorMessage,
            error: error
        };
    }
}

// 忘記密碼（UC-01）
export async function forgotPassword(email) {
    try {
        // 必填檢查
        if (!email || !email.trim()) {
            return {
                success: false,
                message: '請輸入電子郵件'
            };
        }

        // 發送密碼重設郵件
        await sendPasswordResetEmail(auth, email.trim());

        return {
            success: true,
            message: '密碼重設郵件已發送，請檢查您的電子郵件'
        };
    } catch (error) {
        console.error('發送密碼重設郵件失敗:', error);
        let errorMessage = '發送失敗';

        if (error.code === 'auth/user-not-found') {
            errorMessage = '找不到此電子郵件對應的帳號';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = '電子郵件格式不正確';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return {
            success: false,
            message: errorMessage,
            error: error
        };
    }
}

// 登出
export async function logout() {
    try {
        await signOut(auth);
        return {
            success: true,
            message: '已登出'
        };
    } catch (error) {
        console.error('登出失敗:', error);
        return {
            success: false,
            message: `登出失敗: ${error.message}`
        };
    }
}

// 取得當前使用者
export function getCurrentUser() {
    return auth.currentUser;
}

// 等待 Firebase Auth 初始化完成
export function waitForAuth() {
    return new Promise((resolve) => {
        if (auth.currentUser !== null) {
            // 已經有使用者，直接返回
            resolve(auth.currentUser);
            return;
        }

        // 等待認證狀態初始化
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe(); // 只監聽一次
            resolve(user);
        });
    });
}

// 監聽認證狀態變化
export function onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
}

// 根據 UID 取得使用者資料
export async function getUserById(userId) {
    try {
        const userRef = doc(db, usersCollection, userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return {
                success: true,
                user: new User({ ...userSnap.data(), userId: userSnap.id })
            };
        }

        return {
            success: false,
            message: '找不到使用者資料'
        };
    } catch (error) {
        console.error('取得使用者資料失敗:', error);
        return {
            success: false,
            message: `取得使用者資料失敗: ${error.message}`,
            error: error
        };
    }
}

