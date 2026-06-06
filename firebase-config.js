```javascript
// ============================================================================
// ملف: firebase-config.js
// يحتوي على الاتصال بفايربيس + كل المنطق البرمجي (الترجمة، الأصدقاء، الواجهة)
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. مفتاح الربط السري الخاص بسيرفرك
const firebaseConfig = {
  apiKey: "AIzaSyCLFj5UTX9EtuehoMWV02gkPsAgKPvMhzI",
  authDomain: "web-game-260b5.firebaseapp.com",
  projectId: "web-game-260b5",
  storageBucket: "web-game-260b5.firebasestorage.app",
  messagingSenderId: "682229509792",
  appId: "1:682229509792:web:11b4a404459630fcd6a3c5"
};

// 2. تشغيل الاتصال بالسيرفر
const app = initializeApp(firebaseConfig);

// 3. تصدير المتغيرات للاستخدام في ملفات أخرى مستقبلاً
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("تم الاتصال بسيرفر فايربيس بنجاح، والموقع جاهز!");

// ============================================================================
// 4. ربط المتغيرات الأساسية بالـ Window لتكون متاحة لملف HTML
// ============================================================================
window.authInstance = auth; 
window.dbInstance = db; 
window.signOutFunc = signOut; 
window.updateDocFunc = updateDoc; 
window.docFunc = doc; 
window.arrayUnion = arrayUnion; 
window.arrayRemove = arrayRemove; 
window.getDocsFunc = getDocs; 
window.queryFunc = query; 
window.whereFunc = where; 
window.collectionFunc = collection;

window.isGuest = false; 
window.currentFormMode = 'login'; 
window.currentUserData = null; 
window.friendToRemove = null; 
window.friendToReview = null;
window.unsubscribeSnapshot = null;

const hideLoader = () => { 
    const l = document.getElementById('global-loader'); 
    if(l){ l.style.opacity = '0'; setTimeout(()=>l.style.visibility='hidden',400); } 
};

// ============================================================================
// 5. نظام الترجمة الفوري (القاموس)
// ============================================================================
window.translations = {
    ar: {
        "title_home": "الرئيسية", "title_play": "غرف اللعب", "title_achievements": "الإنجازات", "title_friends": "الأصدقاء", "title_store": "المتجر", "title_profile": "الملف الشخصي",
        "welcome_title": "النظام السحابي", "welcome_desc": "سجل دخولك الآن لتتمكن من اللعب، حفظ تقدمك، والتفاعل مع الأصدقاء.",
        "login_btn": "تسجيل الدخول", "guest_btn": "المتابعة كزائر", "register_btn": "حساب جديد",
        "settings": "الإعدادات", "notifications": "التنبيهات", "no_noti": "لا يوجد تنبيهات حالياً",
        "guest_name": "زائر", "guest_status": "غير مسجل", "logout": "تسجيل خروج",
        "font_size": "حجم الواجهة", "font_small": "صغير", "font_default": "افتراضي", "font_large": "كبير",
        "language": "اللغة", "animations": "المؤثرات الحركية", "anim_on": "تشغيل", "anim_off": "إيقاف",
        "theme": "المظهر", "theme_dark": "داكن", "theme_light": "فاتح",
        "login_to_see_friends": "يجب تسجيل الدخول لإضافة الأصدقاء ورؤيتهم.",
        "email_user": "المعرف (Email/Username)", "password": "كلمة المرور", "username": "اسم المستخدم", "email": "البريد الإلكتروني", "confirm_pass": "تأكيد كلمة المرور",
        "email_user_ph": "أدخل البيانات", "username_ph": "مثال: Player1",
        "confirm_login": "تأكيد الدخول", "confirm_register": "إنشاء الحساب",
        "add_friend_title": "إضافة صديق", "add_friend_desc": "أدخل اسم المستخدم لإرسال طلب صداقة.", "search_friend_placeholder": "اسم المستخدم", "send_request": "إرسال الطلب",
        "remove_friend_title": "حذف صديق", "remove_friend_desc": "هل أنت متأكد أنك تريد حذف", "cancel": "إلغاء", "confirm_remove": "تأكيد الحذف",
        "friends": "الأصدقاء", "friend_req_from": "لقد أرسل لك", "friend_req_msg": "طلب صداقة، هل توافق؟", "friend_req_title": "طلب صداقة", "accept": "قبول", "reject": "رفض",
        "new_friend_req": "طلب صداقة جديد من", "now": "الآن"
    },
    en: {
        "title_home": "Home", "title_play": "Play Rooms", "title_achievements": "Achievements", "title_friends": "Friends", "title_store": "Store", "title_profile": "Profile",
        "welcome_title": "Cloud System", "welcome_desc": "Log in now to play, save progress, and interact with friends.",
        "login_btn": "Log In", "guest_btn": "Continue as Guest", "register_btn": "New Account",
        "settings": "Settings", "notifications": "Notifications", "no_noti": "No notifications currently",
        "guest_name": "Guest", "guest_status": "Not registered", "logout": "Log Out",
        "font_size": "UI Size", "font_small": "Small", "font_default": "Default", "font_large": "Large",
        "language": "Language", "animations": "Animations", "anim_on": "On", "anim_off": "Off",
        "theme": "Theme", "theme_dark": "Dark", "theme_light": "Light",
        "login_to_see_friends": "You must log in to see and add friends.",
        "email_user": "Identifier (Email/Username)", "password": "Password", "username": "Username", "email": "Email", "confirm_pass": "Confirm Password",
        "email_user_ph": "Enter details", "username_ph": "e.g. Player1",
        "confirm_login": "Confirm Login", "confirm_register": "Create Account",
        "add_friend_title": "Add Friend", "add_friend_desc": "Enter username to send a friend request.", "search_friend_placeholder": "Username", "send_request": "Send Request",
        "remove_friend_title": "Remove Friend", "remove_friend_desc": "Are you sure you want to remove", "cancel": "Cancel", "confirm_remove": "Confirm Remove",
        "friends": "Friends", "friend_req_from": "", "friend_req_msg": "sent you a friend request. Accept?", "friend_req_title": "Friend Request", "accept": "Accept", "reject": "Decline",
        "new_friend_req": "New friend request from", "now": "Just now"
    }
};
window.currentLang = 'ar';

// ============================================================================
// 6. دوال عرض وتحديث الواجهة (الأصدقاء والتنبيهات)
// ============================================================================
window.renderFriendsList = function(containerId) {
    const container = document.getElementById(containerId); if(!container) return;
    if (window.isGuest || !window.currentUserData) {
        container.innerHTML = `<div class="guest-friends-msg"><i class="ph-duotone ph-lock-key"></i><span data-i18n="login_to_see_friends">${window.translations[window.currentLang].login_to_see_friends}</span></div>`;
        return;
    }
    const friends = window.currentUserData.friends || [];
    let html = `<div class="friends-header" data-i18n="friends">${window.translations[window.currentLang].friends}</div>`;
    if (friends.length === 0) { 
        html += `<button class="add-friend-btn" onclick="openAddFriendModal()"><i class="ph-bold ph-plus"></i></button>`; 
    } else {
        friends.forEach(f => { html += `<div class="friend-avatar" onclick="openRemoveFriendModal('${f}')"><div style="width:100%; height:100%; border-radius:50%; background:var(--surface-panel); display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:16px; color:var(--text-main);">${f.charAt(0).toUpperCase()}</div><div class="online-dot"></div></div>`; });
        html += `<button class="add-friend-btn" onclick="openAddFriendModal()"><i class="ph-bold ph-plus"></i></button>`;
    }
    container.innerHTML = html;
};

window.renderNotifications = function() {
    const list = document.getElementById('noti-list');
    const dot = document.getElementById('noti-dot');
    if(!list || !dot) return;
    
    if (window.isGuest || !window.currentUserData || !window.currentUserData.friendRequests || window.currentUserData.friendRequests.length === 0) {
        list.innerHTML = `<div class="empty-state"><i class="ph-duotone ph-bell-slash"></i><span data-i18n="no_noti">${window.translations[window.currentLang].no_noti}</span></div>`;
        dot.style.display = 'none';
        return;
    }
    
    dot.style.display = 'block'; 
    let html = '';
    window.currentUserData.friendRequests.forEach(req => {
        html += `
            <div class="noti-item" onclick="openReviewRequestModal('${req}')">
                <div class="noti-icon"><i class="ph-bold ph-user-plus"></i></div>
                <div class="noti-text-content">
                    <span class="noti-text"><span data-i18n="new_friend_req">${window.translations[window.currentLang].new_friend_req}</span> <strong>${req}</strong></span>
                    <span class="noti-time" data-i18n="now">${window.translations[window.currentLang].now}</span>
                </div>
            </div>`;
    });
    list.innerHTML = html;
};

// ============================================================================
// 7. المستمع اللحظي لحالة المستخدم (Real-time Firebase Auth & DB Listener)
// ============================================================================
onAuthStateChanged(auth, (user) => {
    const nameEl = document.getElementById('header-name');
    const fallbackAvatar = document.getElementById('header-avatar-fallback');
    const dropdownStatus = document.getElementById('dropdown-status-name');
    const dropdownContent = document.getElementById('dropdown-content-area');

    if (window.unsubscribeSnapshot) {
        window.unsubscribeSnapshot();
        window.unsubscribeSnapshot = null;
    }

    if (user) {
        window.isGuest = false; 
        let isInitialLoad = true; 

        window.unsubscribeSnapshot = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
            if (userDoc.exists()) {
                window.currentUserData = userDoc.data();
                let displayName = window.currentUserData.username || user.email.split('@')[0];

                if(nameEl) {
                    nameEl.removeAttribute('data-i18n'); 
                    nameEl.innerText = displayName;
                }
                if(fallbackAvatar) fallbackAvatar.innerText = displayName.charAt(0).toUpperCase();
                if(dropdownStatus) dropdownStatus.innerText = "متصل";

                if (window.currentUserData.settings) {
                    if(window.toggleTheme) window.toggleTheme(window.currentUserData.settings.theme || 'dark', true);
                    if(window.setFontSize) window.setFontSize(window.currentUserData.settings.fontSize || 'default', true);
                    if(window.setAnimation) window.setAnimation(window.currentUserData.settings.animations !== false, true);
                    if(window.setLanguage && window.currentLang !== window.currentUserData.settings.language) {
                        window.setLanguage(window.currentUserData.settings.language || 'ar', true);
                    }
                }

                window.renderFriendsList('friends-container-desktop'); 
                if(document.getElementById('mobile-friends-wrapper')) window.renderFriendsList('mobile-friends-wrapper');
                window.renderNotifications();

                if (isInitialLoad && dropdownContent) {
                    dropdownContent.innerHTML = `
                        <button class="dropdown-item" onclick="loadFragment('profile', null); toggleDropdown('');"><i class="ph ph-user-circle"></i> <span data-i18n="title_profile">${window.translations[window.currentLang].title_profile}</span></button>
                        <button class="dropdown-item logout" onclick="handleLogout()"><i class="ph ph-sign-out"></i> <span data-i18n="logout">${window.translations[window.currentLang].logout}</span></button>
                    `;
                    if(window.clearAuthInputs) window.clearAuthInputs(); 
                    document.getElementById('auth-modal').classList.add('hidden'); 
                    document.getElementById('app-shell').classList.add('unlocked');
                    
                    const currentActive = document.querySelector('.nav-btn.active');
                    if(currentActive) window.loadFragment(['home','play','achievements','store','profile'][Array.from(document.querySelectorAll('.nav-btn')).indexOf(currentActive)] || 'home', currentActive);
                    hideLoader();
                    isInitialLoad = false;
                }
            }
        });

    } else {
        if (!window.isGuest) {
            window.currentUserData = null; 
            if(window.clearAuthInputs) window.clearAuthInputs(); 
            if(nameEl) {
                nameEl.setAttribute('data-i18n', 'guest_name'); 
                nameEl.innerText = window.translations[window.currentLang].guest_name;
            }
            if(document.getElementById('modal-welcome-view')) document.getElementById('modal-welcome-view').style.display = 'block'; 
            if(document.getElementById('modal-form-view')) document.getElementById('modal-form-view').style.display = 'none';
            if(document.getElementById('auth-modal')) document.getElementById('auth-modal').classList.remove('hidden'); 
            if(document.getElementById('app-shell')) document.getElementById('app-shell').classList.remove('unlocked');
        }
        hideLoader();
    }
});

// ============================================================================
// 8. المنطق البرمجي للواجهة (معالجة النماذج والأزرار)
// ============================================================================

window.handleAuthSubmit = async function(e) {
    e.preventDefault(); const errorDiv = document.getElementById('auth-error'); const btn = document.getElementById('modal-submit-btn');
    errorDiv.style.display = 'none'; btn.disabled = true; btn.innerText = "جاري التحقق...";
    try {
        if (window.currentFormMode === 'login') {
            let id = document.getElementById('login-id').value.trim(); let pass = document.getElementById('login-password').value; let email = id;
            if (!id.includes('@')) { const q = query(collection(db, "users"), where("username_lower", "==", id.toLowerCase())); const snap = await getDocs(q); if (snap.empty) throw { message: "البيانات غير صحيحة" }; email = snap.docs[0].data().email; }
            await signInWithEmailAndPassword(auth, email, pass);
        } else {
            const user = document.getElementById('reg-username').value.trim(); const email = document.getElementById('reg-email').value.trim(); const pass = document.getElementById('reg-password').value; const conf = document.getElementById('reg-confirm').value;
            if (pass !== conf) throw { message: "كلمات المرور غير متطابقة" }; if (pass.length < 6) throw { message: "كلمة المرور 6 أحرف على الأقل" };
            const q = query(collection(db, "users"), where("username_lower", "==", user.toLowerCase())); const snap = await getDocs(q); if (!snap.empty) throw { message: "اسم المستخدم محجوز" };
            const cred = await createUserWithEmailAndPassword(auth, email.toLowerCase(), pass);
            await setDoc(doc(db, "users", cred.user.uid), { username: user, username_lower: user.toLowerCase(), email: email.toLowerCase(), matches: 0, wins: 0, friends: [], friendRequests: [], settings: { theme: 'dark', fontSize: 'default', animations: true, language: 'ar' }, createdAt: new Date().toISOString() });
        }
    } catch (err) {
        let msg = err.message; if(msg.includes("invalid-credential")) msg = "البيانات غير صحيحة"; if(msg.includes("email-already-in-use")) msg = "البريد الإلكتروني مستخدم";
        errorDiv.innerText = msg; errorDiv.style.display = 'block';
    } finally { btn.disabled = false; btn.innerText = window.currentFormMode === 'register' ? window.translations[window.currentLang].confirm_register : window.translations[window.currentLang].confirm_login; }
}

window.setLanguage = async function(lang, skipSave = false) {
    window.currentLang = lang; document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active')); 
    const activeLangBtn = document.getElementById('lang-' + lang);
    if(activeLangBtn) activeLangBtn.classList.add('active');
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (window.translations[lang] && window.translations[lang][key]) {
            if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) el.setAttribute('placeholder', window.translations[lang][key]);
            else el.innerText = window.translations[lang][key];
        }
    });
    window.renderNotifications(); window.renderFriendsList('friends-container-desktop'); if(document.getElementById('mobile-friends-wrapper')) window.renderFriendsList('mobile-friends-wrapper');
    
    const activeBtn = document.querySelector('.nav-btn.active');
    if(activeBtn) {
        const pageId = Array.from(document.querySelectorAll('.nav-btn')).indexOf(activeBtn);
        const pages = ['home', 'play', 'achievements', 'store', 'profile'];
        if(pages[pageId]) {
            const pt = document.getElementById('page-title'); if(pt) pt.innerText = window.translations[lang]['title_' + pages[pageId]];
            const mn = document.getElementById('mobile-section-name'); if(mn) mn.innerText = window.translations[lang]['title_' + pages[pageId]];
        }
    }

    if (!skipSave && window.authInstance && window.authInstance.currentUser && !window.isGuest) {
        try { await window.updateDocFunc(window.docFunc(window.dbInstance, "users", window.authInstance.currentUser.uid), { "settings.language": lang }); } catch(e){}
    }
};

window.setFontSize = async function(size, skipSave = false) {
    document.documentElement.classList.remove('font-small', 'font-large');
    if(size !== 'default') document.documentElement.classList.add(`font-${size}`);
    document.querySelectorAll('#font-small, #font-default, #font-large').forEach(b => b.classList.remove('active')); 
    const sizeBtn = document.getElementById(`font-${size}`); if(sizeBtn) sizeBtn.classList.add('active');
    if (!skipSave && window.authInstance && window.authInstance.currentUser && !window.isGuest) { try { await window.updateDocFunc(window.docFunc(window.dbInstance, "users", window.authInstance.currentUser.uid), { "settings.fontSize": size }); } catch(e){} }
};

window.setAnimation = async function(isOn, skipSave = false) {
    if(isOn) document.body.classList.remove('no-animations'); else document.body.classList.add('no-animations');
    const animOnBtn = document.getElementById('anim-on'); if(animOnBtn) animOnBtn.classList.toggle('active', isOn); 
    const animOffBtn = document.getElementById('anim-off'); if(animOffBtn) animOffBtn.classList.toggle('active', !isOn);
    if (!skipSave && window.authInstance && window.authInstance.currentUser && !window.isGuest) { try { await window.updateDocFunc(window.docFunc(window.dbInstance, "users", window.authInstance.currentUser.uid), { "settings.animations": isOn }); } catch(e){} }
};

window.toggleTheme = async function(mode, skipSave = false) {
    const body = document.body; const darkBtns = [document.getElementById('btn-theme-dark'), document.getElementById('mini-theme-dark')]; const lightBtns = [document.getElementById('btn-theme-light'), document.getElementById('mini-theme-light')];
    if (mode === 'light') { body.setAttribute('data-theme', 'light'); lightBtns.forEach(b => { if(b) b.classList.add('active-theme', 'active'); }); darkBtns.forEach(b => { if(b) b.classList.remove('active-theme', 'active'); }); } 
    else { body.removeAttribute('data-theme'); darkBtns.forEach(b => { if(b) b.classList.add('active-theme', 'active'); }); lightBtns.forEach(b => { if(b) b.classList.remove('active-theme', 'active'); }); }
    if (!skipSave && window.authInstance && window.authInstance.currentUser && !window.isGuest) { try { await window.updateDocFunc(window.docFunc(window.dbInstance, "users", window.authInstance.currentUser.uid), { "settings.theme": mode }); } catch (e) {} }
};

window.openAddFriendModal = function() { document.getElementById('add-friend-modal').classList.remove('hidden'); document.getElementById('friend-error').style.display='none'; document.getElementById('search-friend-input').value=''; }
window.openRemoveFriendModal = function(friendName) { window.friendToRemove = friendName; document.getElementById('remove-friend-name').innerText = friendName; document.getElementById('remove-friend-modal').classList.remove('hidden'); }
window.closeFriendModal = function(id) { document.getElementById(id).classList.add('hidden'); }
window.openReviewRequestModal = function(requesterName) { window.friendToReview = requesterName; document.getElementById('request-sender-name').innerText = requesterName; window.toggleDropdown('noti-dropdown'); document.getElementById('review-request-modal').classList.remove('hidden'); };

window.processFriendRequest = async function(isAccepted) {
    if(!window.friendToReview) return;
    const reqName = window.friendToReview;
    window.closeFriendModal('review-request-modal');
    try {
        if(isAccepted) {
            await window.updateDocFunc(window.docFunc(window.dbInstance, "users", window.authInstance.currentUser.uid), { friends: window.arrayUnion(reqName), friendRequests: window.arrayRemove(reqName) });
            const q = window.queryFunc(window.collectionFunc(window.dbInstance, "users"), window.whereFunc("username_lower", "==", reqName.toLowerCase()));
            const snap = await window.getDocsFunc(q);
            if(!snap.empty) { await window.updateDocFunc(window.docFunc(window.dbInstance, "users", snap.docs[0].id), { friends: window.arrayUnion(window.currentUserData.username) }); }
        } else {
            await window.updateDocFunc(window.docFunc(window.dbInstance, "users", window.authInstance.currentUser.uid), { friendRequests: window.arrayRemove(reqName) });
        }
    } catch(e) { alert("حدث خطأ أثناء معالجة الطلب."); }
};

window.sendFriendRequest = async function() {
    const targetUsername = document.getElementById('search-friend-input').value.trim().toLowerCase(); 
    const errDiv = document.getElementById('friend-error'); 
    if(!targetUsername) return;
    if(targetUsername === window.currentUserData.username_lower) { errDiv.innerText="لا يمكنك إضافة نفسك!"; errDiv.style.display='block'; return; }
    try {
        const q = window.queryFunc(window.collectionFunc(window.dbInstance, "users"), window.whereFunc("username_lower", "==", targetUsername));
        const snap = await window.getDocsFunc(q);
        if(snap.empty) { errDiv.innerText="المستخدم غير موجود."; errDiv.style.display='block'; return; }
        const targetDocId = snap.docs[0].id;
        const myName = window.currentUserData.username || window.authInstance.currentUser.email.split('@')[0];
        await window.updateDocFunc(window.docFunc(window.dbInstance, "users", targetDocId), { friendRequests: window.arrayUnion(myName) });
        alert("تم إرسال الطلب بنجاح!"); window.closeFriendModal('add-friend-modal');
    } catch(e) { errDiv.innerText = "حدث خطأ. تأكد من إعدادات Firestore Rules."; errDiv.style.display='block'; }
}

window.confirmRemoveFriend = async function() {
    if(!window.friendToRemove) return;
    try {
        const targetFriendName = window.friendToRemove;
        const myUid = window.authInstance.currentUser.uid;
        const myName = window.currentUserData.username;
        await window.updateDocFunc(window.docFunc(window.dbInstance, "users", myUid), { friends: window.arrayRemove(targetFriendName) });
        const q = window.queryFunc(window.collectionFunc(window.dbInstance, "users"), window.whereFunc("username_lower", "==", targetFriendName.toLowerCase()));
        const snap = await window.getDocsFunc(q);
        if (!snap.empty) {
            const targetDocId = snap.docs[0].id;
            await window.updateDocFunc(window.docFunc(window.dbInstance, "users", targetDocId), { friends: window.arrayRemove(myName) });
        }
        window.closeFriendModal('remove-friend-modal');
        window.friendToRemove = null;
    } catch(e) { alert("حدث خطأ أثناء الحذف."); }
}

window.clearAuthInputs = function() { const form = document.getElementById('firebase-form'); if(form) form.reset(); const err = document.getElementById('auth-error'); if(err) err.style.display = 'none'; };

window.setFormType = function(type) { 
    window.currentFormMode = type; 
    document.getElementById('tab-login').classList.toggle('active', type === 'login'); document.getElementById('tab-register').classList.toggle('active', type === 'register'); 
    document.getElementById('login-fields').style.display = type === 'login' ? 'block' : 'none'; document.getElementById('register-fields').style.display = type === 'register' ? 'block' : 'none'; 
    document.getElementById('login-id').required = type === 'login'; document.getElementById('login-password').required = type === 'login';
    document.getElementById('reg-username').required = type === 'register'; document.getElementById('reg-email').required = type === 'register'; document.getElementById('reg-password').required = type === 'register';
    document.getElementById('modal-submit-btn').innerText = type === 'register' ? window.translations[window.currentLang].confirm_register : window.translations[window.currentLang].confirm_login;
}

window.toggleDropdown = function(dropdownId, triggerElement) {
    const tgt = document.getElementById(dropdownId); const isOpen = tgt && tgt.classList.contains('show');
    document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show')); document.querySelectorAll('.header-icon-btn, .profile-trigger').forEach(t => t.classList.remove('active'));
    if (!isOpen && tgt) { tgt.classList.add('show'); if(triggerElement) triggerElement.classList.add('active'); }
}

window.onclick = function(e) { 
    if (!e.target.closest('.header-icon-btn') && !e.target.closest('.profile-trigger') && !e.target.closest('.header-dropdown') && !e.target.closest('.modal-card')) { 
        document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show')); 
        document.querySelectorAll('.header-icon-btn, .profile-trigger').forEach(t => t.classList.remove('active')); 
    } 
}

window.handleLogout = function() { 
    window.signOutFunc(window.authInstance).then(() => { 
        document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show'));
        document.body.removeAttribute('data-theme'); document.documentElement.className=''; document.body.className='';
        window.currentUserData = null; window.clearAuthInputs(); 
        const nameEl = document.getElementById('header-name');
        if(nameEl) { nameEl.setAttribute('data-i18n', 'guest_name'); nameEl.innerText = window.translations[window.currentLang].guest_name; }
        document.getElementById('modal-welcome-view').style.display = 'block'; document.getElementById('modal-form-view').style.display = 'none';
        document.getElementById('auth-modal').classList.remove('hidden'); document.getElementById('app-shell').classList.remove('unlocked'); 
    }); 
}

window.switchModalMode = function(mode) { if(mode === 'forms'){ document.getElementById('modal-welcome-view').style.display = 'none'; document.getElementById('modal-form-view').style.display = 'block'; } }

window.openLoginDirectly = function() {
    document.getElementById('modal-welcome-view').style.display = 'none'; document.getElementById('modal-form-view').style.display = 'block';
    window.setFormType('login'); document.getElementById('auth-modal').classList.remove('hidden'); document.getElementById('app-shell').classList.remove('unlocked'); window.toggleDropdown('');
};

window.enterAsGuest = function() {
    window.isGuest = true; window.currentUserData = null;
    const nameEl = document.getElementById('header-name');
    if(nameEl) { nameEl.setAttribute('data-i18n', 'guest_name'); nameEl.innerText = window.translations[window.currentLang].guest_name; }
    const dropStat = document.getElementById('dropdown-status-name'); if(dropStat) dropStat.innerText = window.translations[window.currentLang].guest_status; 
    const avtFall = document.getElementById('header-avatar-fallback'); if(avtFall) avtFall.innerText = "ز";
    window.renderFriendsList('friends-container-desktop'); window.renderNotifications();
    
    const dropContent = document.getElementById('dropdown-content-area');
    if(dropContent) dropContent.innerHTML = `<button class="dropdown-item" onclick="window.openLoginDirectly()"><i class="ph ph-sign-in"></i> <span data-i18n="login_btn">${window.translations[window.currentLang].login_btn}</span></button>`;
    
    window.clearAuthInputs(); document.getElementById('auth-modal').classList.add('hidden'); document.getElementById('app-shell').classList.add('unlocked'); 
    window.loadFragment('home', document.querySelector('.nav-btn.active'));
}

window.closeAuthModal = function() { window.clearAuthInputs(); document.getElementById('auth-modal').classList.add('hidden'); document.getElementById('app-shell').classList.add('unlocked'); if(!window.isGuest) window.enterAsGuest(); }

window.loadFragment = function(pageName, element) {
    const contentHolder = document.getElementById('content-holder');
    const titles = { 'home': 'title_home', 'play': 'title_play', 'achievements': 'title_achievements', 'store': 'title_store', 'friends': 'title_friends', 'profile': 'title_profile' };
    
    const pt = document.getElementById('page-title'); if(pt) pt.innerText = window.translations[window.currentLang][titles[pageName]];
    const mn = document.getElementById('mobile-section-name'); if(mn) mn.innerText = window.translations[window.currentLang][titles[pageName]];
    
    document.querySelectorAll('.nav-btn, .bottom-tab').forEach(btn => { btn.classList.remove('active'); const icon = btn.querySelector('i'); if(icon) icon.className = icon.className.replace('ph-fill', 'ph'); });

    if(element) {
        element.classList.add('active'); const icon = element.querySelector('i'); if(icon) icon.className = icon.className.replace('ph', 'ph-fill');
        const isNav = element.classList.contains('nav-btn');
        const tabsList = isNav ? document.querySelectorAll('.nav-btn') : document.querySelectorAll('.bottom-tab');
        const targetList = isNav ? document.querySelectorAll('.bottom-tab') : document.querySelectorAll('.nav-btn');
        const index = Array.from(tabsList).indexOf(element);
        
        if(pageName === 'friends' && !isNav) {} 
        else if (pageName === 'store' && isNav) { const mStore = document.querySelectorAll('.bottom-tab')[3]; if(mStore) { mStore.classList.add('active'); mStore.querySelector('i').className = mStore.querySelector('i').className.replace('ph', 'ph-fill'); } }
        else if (pageName === 'profile' && isNav) { const mProf = document.querySelectorAll('.bottom-tab')[5]; if(mProf) { mProf.classList.add('active'); mProf.querySelector('i').className = mProf.querySelector('i').className.replace('ph', 'ph-fill'); } }
        else { const matchedTab = targetList[index]; if(matchedTab) { matchedTab.classList.add('active'); matchedTab.querySelector('i').className = matchedTab.querySelector('i').className.replace('ph', 'ph-fill'); } }
    }

    if (pageName === 'friends') {
        contentHolder.innerHTML = `<div id="mobile-friends-wrapper" style="width:100%; max-width:400px; margin: 20px auto; display:flex; flex-direction:column; align-items:center; gap:20px;"></div>`;
        window.renderFriendsList('mobile-friends-wrapper');
    } else {
        contentHolder.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:var(--text-dim); font-size:1.2rem; font-weight:bold;">${window.translations[window.currentLang][titles[pageName]]} - جاهز للبرمجة</div>`;
    }
}

```
