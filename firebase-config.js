import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { 
    apiKey: "AIzaSyCLFj5UTX9EtuehoMWV02gkPsAgKPvMhzI", 
    authDomain: "web-game-260b5.firebaseapp.com", 
    projectId: "web-game-260b5", 
    storageBucket: "web-game-260b5.firebasestorage.app", 
    messagingSenderId: "682229509792", 
    appId: "1:682229509792:web:11b4a404459630fcd6a3c5" 
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 
const db = getFirestore(app);

window.authInstance = auth; 
window.dbInstance = db; 
window.signOutFunc = signOut; 
window.updateDocFunc = updateDoc; 
window.docFunc = doc; 
window.setDocFunc = setDoc; 
window.getDocFunc = getDoc; 
window.arrayUnion = arrayUnion; 
window.arrayRemove = arrayRemove; 
window.getDocsFunc = getDocs; 
window.queryFunc = query; 
window.whereFunc = where; 
window.collectionFunc = collection; 
window.onSnapshotFunc = onSnapshot;

document.addEventListener("visibilitychange", async () => {
    if (auth.currentUser && !window.isGuest) {
        const state = document.visibilityState === 'visible' ? 'online' : 'away';
        try { await updateDoc(doc(db, "users", auth.currentUser.uid), { status: state }); } catch(e){}
    }
});

window.setupRealtimeFriends = function() {
    try {
        if (!window.currentUserData) return;
        const friendsArray = Array.isArray(window.currentUserData.friends) ? window.currentUserData.friends : [];

        Object.keys(window.friendListeners).forEach(fName => {
            if (!friendsArray.includes(fName)) {
                window.friendListeners[fName](); 
                delete window.friendListeners[fName];
                delete window.friendsCache[fName];
            }
        });

        if (friendsArray.length === 0) {
            if(window.drawFriendsUI) window.drawFriendsUI();
            return;
        }

        friendsArray.forEach(fName => {
            if (!fName || typeof fName !== 'string') return;
            if (!window.friendListeners[fName]) {
                const q = query(collection(db, "users"), where("username_lower", "==", fName.toLowerCase()));
                window.friendListeners[fName] = onSnapshot(q, (snap) => {
                    if (!snap.empty) {
                        window.friendsCache[fName] = snap.docs[0].data();
                    } else {
                        window.friendsCache[fName] = { username: fName };
                    }
                    if(window.drawFriendsUI) window.drawFriendsUI();
                });
            }
        });
    } catch (e) { console.error("Error in setupRealtimeFriends:", e); }
};

window.syncUsernameChange = async function(oldName, newName) {
    if(!oldName || !newName || oldName === newName) return;
    try {
        const qFriends = query(collection(db, "users"), where("friends", "array-contains", oldName));
        const snapFriends = await getDocs(qFriends);
        snapFriends.forEach(async (d) => {
            let fArray = d.data().friends || [];
            let newArr = fArray.map(f => f === oldName ? newName : f);
            await updateDoc(doc(db, "users", d.id), { friends: newArr });
        });
        
        const qReq = query(collection(db, "users"), where("friendRequests", "array-contains", oldName));
        const snapReq = await getDocs(qReq);
        snapReq.forEach(async (d) => {
            let rArray = d.data().friendRequests || [];
            let newR = rArray.map(f => f === oldName ? newName : f);
            await updateDoc(doc(db, "users", d.id), { friendRequests: newR });
        });
    } catch(e) { console.error("Error syncing username:", e); }
};

// ==============================================
// التنبيهات المحدثة (أرقام، ترتيب، قبول ورفض)
// ==============================================
window.renderNotifications = function() {
    const list = document.getElementById('noti-list'); 
    const dot = document.getElementById('noti-dot');
    if(!list || !dot) return;
    
    const friendReqs = (window.currentUserData && window.currentUserData.friendRequests) ? window.currentUserData.friendRequests : [];
    const gameInvites = (window.currentUserData && window.currentUserData.gameInvites) ? window.currentUserData.gameInvites : [];
    
    const totalNotis = friendReqs.length + gameInvites.length;

    if (window.isGuest || !window.currentUserData || totalNotis === 0) {
        list.innerHTML = `<div class="empty-state"><i class="ph-duotone ph-bell-slash"></i><span>لا يوجد تنبيهات حالياً</span></div>`;
        dot.style.display = 'none'; 
        return;
    }
    
    // تصميم أيقونة التنبيه كـ (شريط أرقام)
    dot.style.display = 'flex';
    dot.style.justifyContent = 'center';
    dot.style.alignItems = 'center';
    dot.style.width = '18px';
    dot.style.height = '18px';
    dot.style.borderRadius = '50%';
    dot.style.fontSize = '0.65rem';
    dot.style.fontWeight = '800';
    dot.style.color = 'white';
    dot.innerText = totalNotis > 9 ? '+9' : totalNotis;
    
    // دمج التنبيهات للترتيب
    let allNotis = [];
    
    gameInvites.forEach(inv => {
        allNotis.push({ type: 'invite', timestamp: inv.timestamp || 0, data: inv });
    });

    friendReqs.forEach(req => {
        // نضع رقماً عالياً لطلبات الصداقة لتظهر كأنها "الآن"
        allNotis.push({ type: 'friendReq', timestamp: Date.now() + 1000, data: req });
    });

    // الترتيب من الأحدث (الرقم الأكبر) إلى الأقدم
    allNotis.sort((a, b) => b.timestamp - a.timestamp);

    let html = '';
    
    allNotis.forEach(noti => {
        if (noti.type === 'invite') {
            const inv = noti.data;
            html += `
            <div class="noti-item" style="cursor: default; align-items: flex-start;">
                <div class="noti-icon" style="background: rgba(255, 76, 106, 0.1); color: var(--accent-red); margin-top: 5px;"><i class="ph-bold ph-sword"></i></div>
                <div class="noti-text-content" style="flex: 1;">
                    <span class="noti-text">دعوة للعب من <strong>${inv.hostName}</strong></span>
                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <button onclick="window.acceptGameInvite('${inv.roomId}', ${inv.timestamp})" style="flex:1; background: var(--accent-green); color: white; border: none; padding: 8px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.8rem; transition: 0.2s;" onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter='brightness(1)'">قبول</button>
                        <button onclick="window.rejectGameInvite(${inv.timestamp})" style="flex:1; background: rgba(255, 255, 255, 0.05); color: var(--text-dim); border: 1px solid rgba(255,255,255,0.1); padding: 8px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.8rem; transition: 0.2s;" onmouseover="this.style.color='white'; this.style.background='rgba(255, 76, 106, 0.8)'; this.style.borderColor='transparent';" onmouseout="this.style.color='var(--text-dim)'; this.style.background='rgba(255, 255, 255, 0.05)'; this.style.borderColor='rgba(255,255,255,0.1)';">رفض</button>
                    </div>
                </div>
            </div>`;
        } else if (noti.type === 'friendReq') {
            const req = noti.data;
            html += `
            <div class="noti-item" onclick="window.openReviewRequestModal('${req}')">
                <div class="noti-icon" style="background: rgba(52, 152, 219, 0.1); color: #3498db;"><i class="ph-bold ph-user-plus"></i></div>
                <div class="noti-text-content">
                    <span class="noti-text"><span>طلب صداقة من</span> <strong>${req}</strong></span>
                    <span class="noti-time">انقر للمراجعة</span>
                </div>
            </div>`;
        }
    });

    list.innerHTML = html;
};

// دوال التحكم بالدعوات
window.acceptGameInvite = async function(roomId, timestamp) {
    if (window.currentUserData && window.currentUserData.gameInvites) {
        const updatedInvites = window.currentUserData.gameInvites.filter(i => i.timestamp !== timestamp);
        try { await window.updateDocFunc(window.docFunc(window.dbInstance, "users", window.authInstance.currentUser.uid), { gameInvites: updatedInvites }); } 
        catch(e) { console.error(e); }
    }
    if(window.toggleDropdown) window.toggleDropdown('');
    if(window.joinFirebaseRoom) window.joinFirebaseRoom(roomId);
};

window.rejectGameInvite = async function(timestamp) {
    if (window.currentUserData && window.currentUserData.gameInvites) {
        const updatedInvites = window.currentUserData.gameInvites.filter(i => i.timestamp !== timestamp);
        try { await window.updateDocFunc(window.docFunc(window.dbInstance, "users", window.authInstance.currentUser.uid), { gameInvites: updatedInvites }); } 
        catch(e) { console.error(e); }
    }
};

onAuthStateChanged(auth, async (user) => {
    const nameEl = document.getElementById('header-name'); 
    const fallbackAvatar = document.getElementById('header-avatar-fallback');
    const dropdownStatus = document.getElementById('dropdown-status-name'); 
    const dropdownContent = document.getElementById('dropdown-content-area');

    if (window.unsubscribeSnapshot) { window.unsubscribeSnapshot(); window.unsubscribeSnapshot = null; }

    if (user) {
        window.isGuest = false; let isInitialLoad = true; 
        
        try { await updateDoc(doc(db, "users", user.uid), { status: 'online' }); } catch(e){}

        window.unsubscribeSnapshot = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
            if (userDoc.exists()) {
                window.currentUserData = userDoc.data();
                window.currentUserData.uid = user.uid;
                
                let displayName = window.currentUserData.username || user.email.split('@')[0];
                if(nameEl){ nameEl.removeAttribute('data-i18n'); nameEl.innerText = displayName; }
                
                if(fallbackAvatar) {
                    if(window.currentUserData.avatar) {
                        fallbackAvatar.innerHTML = `<img src="${window.currentUserData.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                        fallbackAvatar.style.border = 'none';
                    } else {
                        fallbackAvatar.innerHTML = displayName.charAt(0).toUpperCase();
                        fallbackAvatar.style.border = '';
                    }
                }
                
                if(dropdownStatus) dropdownStatus.innerText = "متصل";

                if (window.currentUserData.settings) {
                    if(window.toggleTheme) window.toggleTheme(window.currentUserData.settings.theme || 'dark', true);
                    if(window.setFontSize) window.setFontSize(window.currentUserData.settings.fontSize || 'default', true);
                    if(window.setAnimation) window.setAnimation(window.currentUserData.settings.animations !== false, true);
                    if(window.setLanguage && window.currentLang !== window.currentUserData.settings.language) window.setLanguage(window.currentUserData.settings.language || 'ar', true);
                }

                window.setupRealtimeFriends();
                window.renderNotifications();

                if (isInitialLoad && dropdownContent) {
                    dropdownContent.innerHTML = `<button class="dropdown-item" onclick="window.loadFragment('profile', null); window.toggleDropdown('');"><i class="ph ph-user-circle"></i> <span>الملف الشخصي</span></button><button class="dropdown-item logout" onclick="window.handleLogout()"><i class="ph ph-sign-out"></i> <span>تسجيل خروج</span></button>`;
                    if(window.clearAuthInputs) window.clearAuthInputs(); 
                    document.getElementById('auth-modal').classList.add('hidden'); 
                    document.getElementById('app-shell').classList.add('unlocked');
                    
                    let savedPage = sessionStorage.getItem('lastActivePage') || 'home';
                    let activeRoom = window.currentUserData.activeRoom;

                    if (activeRoom) {
                        window.currentRoomId = activeRoom;
                        savedPage = 'lobby';
                    }

                    if(window.loadFragment) window.loadFragment(savedPage, null);
                    if(window.currentRoomId && window.listenToRoom) window.listenToRoom();

                    if(window.hideLoader) window.hideLoader(); 
                    isInitialLoad = false;
                }
            }
        });
    } else {
        if (!window.isGuest) {
            window.currentUserData = null; 
            if(window.clearAuthInputs) window.clearAuthInputs(); 
            if(nameEl) { nameEl.setAttribute('data-i18n', 'guest_name'); nameEl.innerText = "زائر"; }
            if(fallbackAvatar) { fallbackAvatar.innerHTML = "ز"; fallbackAvatar.style.border = ''; }
            if(document.getElementById('modal-welcome-view')) document.getElementById('modal-welcome-view').style.display = 'block'; 
            if(document.getElementById('modal-form-view')) document.getElementById('modal-form-view').style.display = 'none';
            if(document.getElementById('auth-modal')) document.getElementById('auth-modal').classList.remove('hidden'); 
            if(document.getElementById('app-shell')) document.getElementById('app-shell').classList.remove('unlocked');
        }
        if(window.hideLoader) window.hideLoader();
    }
});

window.handleAuthSubmit = async function(e) {
    if(e) e.preventDefault();
    const errorDiv = document.getElementById('auth-error'); 
    const btn = document.getElementById('modal-submit-btn');
    if(errorDiv) errorDiv.style.display = 'none'; 
    if(btn) { btn.disabled = true; btn.innerText = "جاري التحقق..."; }
    
    try {
        let authResult;
        if (window.currentFormMode === 'login') {
            let id = document.getElementById('login-id').value.trim(); 
            let pass = document.getElementById('login-password').value; 
            if(!id || !pass) throw { message: "الرجاء تعبئة جميع البيانات" };
            let email = id;
            if (!id.includes('@')) { 
                const q = query(collection(db, "users"), where("username_lower", "==", id.toLowerCase())); 
                const snap = await getDocs(q); 
                if (snap.empty) throw { message: "البيانات غير صحيحة" }; 
                email = snap.docs[0].data().email; 
            }
            authResult = await signInWithEmailAndPassword(auth, email, pass);
            await updateDoc(doc(db, "users", authResult.user.uid), { status: 'online' });
        } else {
            const user = document.getElementById('reg-username').value.trim(); 
            const email = document.getElementById('reg-email').value.trim(); 
            const pass = document.getElementById('reg-password').value; 
            const conf = document.getElementById('reg-confirm').value;
            
            if(!user || !email || !pass || !conf) throw { message: "الرجاء إكمال جميع الحقول" };
            if (pass !== conf) throw { message: "كلمات المرور غير متطابقة" }; 
            if (pass.length < 6) throw { message: "كلمة المرور 6 أحرف على الأقل" };
            
            const q = query(collection(db, "users"), where("username_lower", "==", user.toLowerCase())); 
            const snap = await getDocs(q); 
            if (!snap.empty) throw { message: "اسم المستخدم محجوز مسبقاً" };
            
            authResult = await createUserWithEmailAndPassword(auth, email.toLowerCase(), pass);
            await setDoc(doc(db, "users", authResult.user.uid), { 
                username: user, username_lower: user.toLowerCase(), email: email.toLowerCase(), 
                matches: 0, wins: 0, friends: [], friendRequests: [], status: 'online',
                settings: { theme: 'dark', fontSize: 'default', animations: true, language: 'ar' }, 
                createdAt: new Date().toISOString() 
            });
        }
    } catch (err) {
        let msg = err.message; 
        if(msg.includes("invalid-credential")) msg = "البيانات غير صحيحة"; 
        if(msg.includes("email-already-in-use")) msg = "البريد الإلكتروني مستخدم لحساب آخر";
        if(errorDiv) { errorDiv.innerText = msg; errorDiv.style.display = 'block'; }
    } finally { 
        if(btn) { 
            btn.disabled = false; 
            try { btn.innerText = window.currentFormMode === 'register' ? (window.translations ? window.translations[window.currentLang].confirm_register : "إنشاء الحساب") : (window.translations ? window.translations[window.currentLang].confirm_login : "تأكيد الدخول"); } 
            catch(error) { btn.innerText = window.currentFormMode === 'register' ? "تأكيد الحساب" : "تأكيد الدخول"; }
        } 
    }
};

window.handleLogout = async function() { 
    if(auth.currentUser) {
        try { 
            await updateDoc(doc(db, "users", auth.currentUser.uid), { status: 'offline', activeRoom: null }); 
        } catch(e){}
    }
    signOut(auth).then(() => { 
        document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show'));
        document.body.removeAttribute('data-theme'); document.documentElement.className=''; document.body.className='';
        window.currentUserData = null; 
        sessionStorage.clear(); 
        if(window.clearAuthInputs) window.clearAuthInputs(); 
        const nameEl = document.getElementById('header-name'); if(nameEl) { nameEl.setAttribute('data-i18n', 'guest_name'); nameEl.innerText = "زائر"; }
        const fallbackAvatar = document.getElementById('header-avatar-fallback'); if(fallbackAvatar) { fallbackAvatar.innerHTML = "ز"; fallbackAvatar.style.border = ''; }
        const wView = document.getElementById('modal-welcome-view'); if(wView) wView.style.display = 'block'; 
        const fView = document.getElementById('modal-form-view'); if(fView) fView.style.display = 'none';
        const aModal = document.getElementById('auth-modal'); if(aModal) aModal.classList.remove('hidden'); 
        const shell = document.getElementById('app-shell'); if(shell) shell.classList.remove('unlocked'); 
    }); 
};

window.sendFriendRequest = async function() {
    const targetUsername = document.getElementById('search-friend-input').value.trim().toLowerCase(); const errDiv = document.getElementById('friend-error'); if(!targetUsername) return;
    if(targetUsername === window.currentUserData.username_lower) { errDiv.innerText="لا يمكنك إضافة نفسك!"; errDiv.style.display='block'; return; }
    try {
        const q = query(collection(db, "users"), where("username_lower", "==", targetUsername));
        const snap = await getDocs(q);
        if(snap.empty) { errDiv.innerText="المستخدم غير موجود."; errDiv.style.display='block'; return; }
        const targetDocId = snap.docs[0].id; const myName = window.currentUserData.username || auth.currentUser.email.split('@')[0];
        await updateDoc(doc(db, "users", targetDocId), { friendRequests: arrayUnion(myName) });
        alert("تم إرسال الطلب بنجاح!"); 
        if(window.closeFriendModal) window.closeFriendModal('add-friend-modal');
    } catch(e) { errDiv.innerText = "حدث خطأ في الإرسال."; errDiv.style.display='block'; }
};

window.processFriendRequest = async function(isAccepted) {
    if(!window.friendToReview) return; const reqName = window.friendToReview; 
    if(window.closeFriendModal) window.closeFriendModal('review-request-modal');
    try {
        if(isAccepted) {
            await updateDoc(doc(db, "users", auth.currentUser.uid), { friends: arrayUnion(reqName), friendRequests: arrayRemove(reqName) });
            const q = query(collection(db, "users"), where("username_lower", "==", reqName.toLowerCase()));
            const snap = await getDocs(q);
            if(!snap.empty) { await updateDoc(doc(db, "users", snap.docs[0].id), { friends: arrayUnion(window.currentUserData.username) }); }
        } else {
            await updateDoc(doc(db, "users", auth.currentUser.uid), { friendRequests: arrayRemove(reqName) });
        }
    } catch(e) { alert("حدث خطأ أثناء معالجة الطلب."); }
};

window.confirmRemoveFriend = async function() {
    if(!window.friendToRemove || !auth.currentUser) return;
    try {
        const targetFriendName = window.friendToRemove; const myUid = auth.currentUser.uid; const myName = window.currentUserData.username;
        await updateDoc(doc(db, "users", myUid), { friends: arrayRemove(targetFriendName) });
        const q = query(collection(db, "users"), where("username_lower", "==", targetFriendName.toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) { 
            const targetDocId = snap.docs[0].id; 
            await updateDoc(doc(db, "users", targetDocId), { friends: arrayRemove(myName) }); 
        }
        if(window.closeFriendModal) window.closeFriendModal('remove-friend-modal'); 
        window.friendToRemove = null;
    } catch(e) { alert("حدث خطأ أثناء الحذف."); }
};
