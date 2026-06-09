import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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
const storage = getStorage(app);

window.authInstance = auth; window.dbInstance = db; window.storageInstance = storage; 
window.signOutFunc = signOut; window.updateDocFunc = updateDoc; window.docFunc = doc; 
window.arrayUnion = arrayUnion; window.arrayRemove = arrayRemove; window.getDocsFunc = getDocs; 
window.queryFunc = query; window.whereFunc = where; window.collectionFunc = collection;

window.isGuest = false; window.currentFormMode = 'login'; window.currentUserData = null; 
window.friendToRemove = null; window.friendToReview = null;
window.unsubscribeSnapshot = null; window.currentLang = 'ar';

// مكتبة الأصول (Assets) لاستخراج أيقونات البادجات للأصدقاء بشكل صحيح
window.gameAssets = window.gameAssets || {
    badges: [
        { id: 'beginner', name: 'مبتدئ', icon: 'ph-shield-star', color: '#ff4c6a' },
        { id: 'veteran', name: 'مخضرم', icon: 'ph-sword', color: '#3498db' },
        { id: 'master', name: 'محترف', icon: 'ph-crown', color: '#f1c40f' }
    ]
};

const hideLoader = () => { 
    const l = document.getElementById('global-loader'); 
    if(l){ l.style.opacity = '0'; setTimeout(() => l.style.visibility = 'hidden', 400); } 
};

// 1. الدالة المطورة لعرض الأصدقاء (تدعم ستايل الدوائر وستايل الأمبلمات)
window.renderFriendsList = async function(containerId, isFullCard = false) {
    const container = document.getElementById(containerId); if(!container) return;
    
    if (window.isGuest || !window.currentUserData) {
        if(isFullCard) {
            container.innerHTML = `<div class="empty-content-box" style="height: 100%; border:none; justify-content:center;"><i class="ph-duotone ph-lock-key"></i><span>يجب تسجيل الدخول لإضافة الأصدقاء ورؤيتهم.</span></div>`;
        } else {
            container.innerHTML = `<div class="guest-friends-msg"><i class="ph-duotone ph-lock-key"></i><span data-i18n="login_to_see_friends">يجب تسجيل الدخول لرؤية الأصدقاء</span></div>`;
        }
        return;
    }

    const friends = window.currentUserData.friends || [];
    
    // سحب بيانات كل الأصدقاء بسرعة فائقة في نفس اللحظة (Promise.all)
    const friendsData = await Promise.all(friends.map(async (f) => {
        try {
            const q = query(collection(db, "users"), where("username_lower", "==", f.toLowerCase()));
            const snap = await getDocs(q);
            return snap.empty ? { username: f } : snap.docs[0].data();
        } catch(e) { return { username: f }; }
    }));

    if (friends.length === 0) { 
        if(!isFullCard) {
            container.innerHTML = `<div class="friends-header">الأصدقاء</div><button class="add-friend-btn" onclick="window.openAddFriendModal()"><i class="ph-bold ph-plus"></i></button>`;
        } else {
            container.innerHTML = `<div class="empty-content-box" style="height: 100%; border:none; justify-content:center;"><i class="ph-duotone ph-users-slash"></i><span>قائمة الأصدقاء فارغة. قم بإضافة أصدقاء جدد!</span></div>`;
        }
        return;
    }

    let innerHtml = '';
    
    if(!isFullCard) {
        innerHtml += `<div class="friends-header">الأصدقاء</div><div style="display:flex; flex-direction:column; gap:15px; align-items:center; width:100%;">`;
    }

    for (const fData of friendsData) {
        const fName = fData.username || 'Unknown';
        
        // جلب شكل البادج الخاص بالصديق
        let fBadge = fData.badge || 'beginner';
        let badgeObj = window.gameAssets.badges.find(b => b.id === fBadge) || window.gameAssets.badges[0];
        let badgeIcon = `<i class="ph-fill ${badgeObj.icon}" style="color: ${badgeObj.color};"></i>`;
        
        if (isFullCard) {
            // تصميم الأمبلم الكامل لصفحة الأصدقاء
            let emblemSrc = fData.emblem || 'assets/images/default-emblem.png';
            let titleHtml = (fData.title && fData.title !== '') ? `<div class="friend-title">${fData.title}</div>` : '';
            
            innerHtml += `
                <div class="friend-emblem-card" onclick="window.openFriendActionModal('${fName}')">
                    <div class="friend-status-dot"></div>
                    <div class="friend-emblem-bg" style="background-image: url('${emblemSrc}');"></div>
                    <div class="friend-emblem-content">
                        <div class="friend-badge">${badgeIcon}</div>
                        <div class="friend-text-group">
                            <div class="friend-name">${fName}</div>
                            ${titleHtml}
                        </div>
                    </div>
                </div>
            `;
        } else {
            // تصميم الدائرة الصغيرة للشريط الجانبي
            let avatarHtml = `<div style="width:100%; height:100%; border-radius:50%; background:var(--surface-panel); display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:16px; color:var(--text-main);">${fName.charAt(0).toUpperCase()}</div>`;
            if (fData.avatar) avatarHtml = `<img src="${fData.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            
            innerHtml += `<div class="friend-avatar" onclick="window.openFriendActionModal('${fName}')">${avatarHtml}<div class="online-dot"></div></div>`;
        }
    }

    if(!isFullCard) {
        innerHtml += `</div><button class="add-friend-btn" onclick="window.openAddFriendModal()"><i class="ph-bold ph-plus"></i></button>`;
    }
    
    container.innerHTML = innerHtml;
};

// 2. النافذة المنبثقة لخيارات الصديق (الأمبلم بدون ظلال مع الأزرار الثلاثة)
window.openFriendActionModal = async function(friendName) {
    let existingModal = document.getElementById('dynamic-friend-modal');
    if(existingModal) existingModal.remove();

    let friendData = null;
    try {
        const q = query(collection(db, "users"), where("username_lower", "==", friendName.toLowerCase()));
        const snap = await getDocs(q);
        if(!snap.empty) friendData = snap.docs[0].data();
    } catch(e) { console.error(e); }

    if(!friendData) return;

    let fBadge = friendData.badge || 'beginner';
    let badgeObj = window.gameAssets.badges.find(b => b.id === fBadge) || window.gameAssets.badges[0];
    let badgeHtml = `<i class="ph-fill ${badgeObj.icon}" style="color: ${badgeObj.color};"></i>`;
    
    let titleHtml = '';
    if(friendData.title && friendData.title !== '') {
        titleHtml = `<div style="font-size: 0.75rem; font-weight: 700; color: gold; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; background: rgba(0,0,0,0.6); border-radius: 8px; backdrop-filter: blur(5px); border: 1px solid rgba(255,215,0,0.5); margin-top: 5px;">${friendData.title}</div>`;
    }

    let fEmblem = friendData.emblem || 'assets/images/default-emblem.png';

    // هيكل النافذة (بدون ظلال يسار على الأمبلم)
    const modalHtml = `
        <div class="profile-modal-content" style="padding: 0; overflow: hidden; background: var(--surface-panel); width: 90%; max-width: 420px; border-radius: 24px; box-shadow: var(--shadow-soft); position: relative; animation: smoothFadeIn 0.3s ease;">
            
            <button onclick="document.getElementById('dynamic-friend-modal').remove()" style="position: absolute; top: 15px; right: 15px; z-index: 100; background: rgba(0,0,0,0.5); border: none; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; backdrop-filter: blur(5px); transition: 0.2s;"><i class="ph-bold ph-x"></i></button>
            
            <div style="position: relative; width: 100%; height: 160px; background-color: #1a1a24; direction: ltr !important;">
                <div style="position: absolute; inset: 0; background-image: url('${fEmblem}'); background-size: cover; background-position: right center; background-repeat: no-repeat;"></div>
                
                <div style="position: relative; z-index: 2; height: 100%; display: flex; align-items: center; justify-content: flex-start; gap: 15px; padding: 0 25px;">
                    <div style="width: 55px; height: 55px; background: rgba(255,255,255,0.1); border: 2px dashed rgba(255,255,255,0.4); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.8rem; backdrop-filter: blur(5px); box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                        ${badgeHtml}
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: center;">
                        <div style="font-size: 2.2rem; font-weight: 800; color: white; font-family: var(--font-en); text-shadow: 0 2px 5px rgba(0,0,0,0.6); letter-spacing: 1px; line-height: 1;">${friendData.username}</div>
                        ${titleHtml}
                    </div>
                </div>
            </div>

            <div style="padding: 25px; display: flex; flex-direction: column; gap: 12px;">
                <button style="background: rgba(255,255,255,0.05); color: var(--text-main); border: 1px solid rgba(100,100,100,0.2); padding: 14px; border-radius: 14px; font-weight: bold; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; transition: 0.3s; font-size: 1rem;" onclick="alert('سيتم فتح صفحة الملف الشخصي للصديق')">
                    <i class="ph-bold ph-user-circle"></i> الملف الشخصي
                </button>
                
                <button style="background: rgba(255,255,255,0.05); color: var(--text-main); border: 1px solid rgba(100,100,100,0.2); padding: 14px; border-radius: 14px; font-weight: bold; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; transition: 0.3s; font-size: 1rem;" onclick="alert('سيتم فتح سجل مباريات وإحصائيات الصديق')">
                    <i class="ph-bold ph-clock-counter-clockwise"></i> السجل
                </button>
                
                <button style="background: rgba(255, 76, 106, 0.1); color: var(--accent-red); border: 1px solid rgba(255, 76, 106, 0.3); padding: 14px; border-radius: 14px; font-weight: bold; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; transition: 0.3s; font-size: 1rem; margin-top: 5px;" onclick="document.getElementById('dynamic-friend-modal').remove(); window.openRemoveFriendModal('${friendName}');">
                    <i class="ph-bold ph-user-minus"></i> حذف صديق
                </button>
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.id = 'dynamic-friend-modal';
    modal.className = 'profile-modal show';
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(10px);';
    
    modal.onclick = function(e) { if(e.target === modal) modal.remove(); };
    modal.innerHTML = modalHtml;
    
    document.body.appendChild(modal);
};

window.renderNotifications = function() {
    const list = document.getElementById('noti-list'); const dot = document.getElementById('noti-dot');
    if(!list || !dot) return;
    if (window.isGuest || !window.currentUserData || !window.currentUserData.friendRequests || window.currentUserData.friendRequests.length === 0) {
        list.innerHTML = `<div class="empty-state"><i class="ph-duotone ph-bell-slash"></i><span data-i18n="no_noti">${window.translations[window.currentLang].no_noti}</span></div>`;
        dot.style.display = 'none'; return;
    }
    dot.style.display = 'block'; let html = '';
    window.currentUserData.friendRequests.forEach(req => {
        html += `<div class="noti-item" onclick="window.openReviewRequestModal('${req}')"><div class="noti-icon"><i class="ph-bold ph-user-plus"></i></div><div class="noti-text-content"><span class="noti-text"><span data-i18n="new_friend_req">${window.translations[window.currentLang].new_friend_req}</span> <strong>${req}</strong></span><span class="noti-time" data-i18n="now">${window.translations[window.currentLang].now}</span></div></div>`;
    });
    list.innerHTML = html;
};

// المراقب اللحظي
onAuthStateChanged(auth, (user) => {
    const nameEl = document.getElementById('header-name'); const fallbackAvatar = document.getElementById('header-avatar-fallback');
    const dropdownStatus = document.getElementById('dropdown-status-name'); const dropdownContent = document.getElementById('dropdown-content-area');

    if (window.unsubscribeSnapshot) { window.unsubscribeSnapshot(); window.unsubscribeSnapshot = null; }

    if (user) {
        window.isGuest = false; let isInitialLoad = true; 
        window.unsubscribeSnapshot = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
            if (userDoc.exists()) {
                window.currentUserData = userDoc.data();
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

                // التحديث اللحظي للقوائم (إرسال false للكمبيوتر و true لصفحة الجوال)
                window.renderFriendsList('friends-container-desktop', false); 
                if(document.getElementById('mobile-friends-wrapper')) {
                    window.renderFriendsList('mobile-friends-wrapper', true);
                }
                
                window.renderNotifications();

                if (isInitialLoad && dropdownContent) {
                    dropdownContent.innerHTML = `<button class="dropdown-item" onclick="window.loadFragment('profile', null); window.toggleDropdown('');"><i class="ph ph-user-circle"></i> <span data-i18n="title_profile">${window.translations[window.currentLang].title_profile}</span></button><button class="dropdown-item logout" onclick="window.handleLogout()"><i class="ph ph-sign-out"></i> <span data-i18n="logout">${window.translations[window.currentLang].logout}</span></button>`;
                    if(window.clearAuthInputs) window.clearAuthInputs(); 
                    document.getElementById('auth-modal').classList.add('hidden'); 
                    document.getElementById('app-shell').classList.add('unlocked');
                    
                    const currentActive = document.querySelector('.nav-btn.active');
                    if(currentActive) window.loadFragment(['home','play','achievements','store','profile'][Array.from(document.querySelectorAll('.nav-btn')).indexOf(currentActive)] || 'home', currentActive);
                    hideLoader(); isInitialLoad = false;
                }
            }
        });
    } else {
        if (!window.isGuest) {
            window.currentUserData = null; if(window.clearAuthInputs) window.clearAuthInputs(); 
            if(nameEl) { nameEl.setAttribute('data-i18n', 'guest_name'); nameEl.innerText = "زائر"; }
            if(fallbackAvatar) { fallbackAvatar.innerHTML = "ز"; fallbackAvatar.style.border = ''; }
            if(document.getElementById('modal-welcome-view')) document.getElementById('modal-welcome-view').style.display = 'block'; 
            if(document.getElementById('modal-form-view')) document.getElementById('modal-form-view').style.display = 'none';
            if(document.getElementById('auth-modal')) document.getElementById('auth-modal').classList.remove('hidden'); 
            if(document.getElementById('app-shell')) document.getElementById('app-shell').classList.remove('unlocked');
        }
        hideLoader();
    }
});

window.handleAuthSubmit = async function(e) {
    if(e) e.preventDefault();
    const errorDiv = document.getElementById('auth-error'); 
    const btn = document.getElementById('modal-submit-btn');
    if(errorDiv) errorDiv.style.display = 'none'; 
    if(btn) { btn.disabled = true; btn.innerText = "جاري التحقق..."; }
    
    try {
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
            await signInWithEmailAndPassword(auth, email, pass);
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
            
            const cred = await createUserWithEmailAndPassword(auth, email.toLowerCase(), pass);
            await setDoc(doc(db, "users", cred.user.uid), { 
                username: user, username_lower: user.toLowerCase(), email: email.toLowerCase(), 
                matches: 0, wins: 0, friends: [], friendRequests: [], 
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
            try { btn.innerText = window.currentFormMode === 'register' ? window.translations[window.currentLang].confirm_register : window.translations[window.currentLang].confirm_login; } 
            catch(error) { btn.innerText = window.currentFormMode === 'register' ? "تأكيد الحساب" : "تأكيد الدخول"; }
        } 
    }
};

window.setLanguage = async function(lang, skipSave = false) {
    window.currentLang = lang; document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active')); const langBtn = document.getElementById('lang-' + lang); if(langBtn) langBtn.classList.add('active');
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (window.translations && window.translations[lang] && window.translations[lang][key]) {
            if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) el.setAttribute('placeholder', window.translations[lang][key]);
            else el.innerText = window.translations[lang][key];
        }
    });
    window.renderNotifications(); 
    window.renderFriendsList('friends-container-desktop', false); 
    if(document.getElementById('mobile-friends-wrapper')) window.renderFriendsList('mobile-friends-wrapper', true);
    
    const activeBtn = document.querySelector('.nav-btn.active');
    if(activeBtn) {
        const pageId = Array.from(document.querySelectorAll('.nav-btn')).indexOf(activeBtn); const pages = ['home', 'play', 'achievements', 'store', 'profile'];
        if(pages[pageId]) { const pt = document.getElementById('page-title'); if(pt) pt.innerText = window.translations[lang]['title_' + pages[pageId]]; const mn = document.getElementById('mobile-section-name'); if(mn) mn.innerText = window.translations[lang]['title_' + pages[pageId]]; }
    }
    if (!skipSave && auth.currentUser && !window.isGuest) { try { await updateDoc(doc(db, "users", auth.currentUser.uid), { "settings.language": lang }); } catch(e){} }
};

window.setFontSize = async function(size, skipSave = false) {
    document.documentElement.classList.remove('font-small', 'font-large'); if(size !== 'default') document.documentElement.classList.add(`font-${size}`);
    document.querySelectorAll('#font-small, #font-default, #font-large').forEach(b => b.classList.remove('active')); const sizeBtn = document.getElementById(`font-${size}`); if(sizeBtn) sizeBtn.classList.add('active');
    if (!skipSave && auth.currentUser && !window.isGuest) { try { await updateDoc(doc(db, "users", auth.currentUser.uid), { "settings.fontSize": size }); } catch(e){} }
};

window.setAnimation = async function(isOn, skipSave = false) {
    if(isOn) document.body.classList.remove('no-animations'); else document.body.classList.add('no-animations');
    const animOn = document.getElementById('anim-on'); if(animOn) animOn.classList.toggle('active', isOn); const animOff = document.getElementById('anim-off'); if(animOff) animOff.classList.toggle('active', !isOn);
    if (!skipSave && auth.currentUser && !window.isGuest) { try { await updateDoc(doc(db, "users", auth.currentUser.uid), { "settings.animations": isOn }); } catch(e){} }
};

window.toggleTheme = async function(mode, skipSave = false) {
    const body = document.body; const darkBtns = [document.getElementById('btn-theme-dark'), document.getElementById('mini-theme-dark')]; const lightBtns = [document.getElementById('btn-theme-light'), document.getElementById('mini-theme-light')];
    if (mode === 'light') { body.setAttribute('data-theme', 'light'); lightBtns.forEach(b => { if(b) b.classList.add('active-theme', 'active'); }); darkBtns.forEach(b => { if(b) b.classList.remove('active-theme', 'active'); }); } 
    else { body.removeAttribute('data-theme'); darkBtns.forEach(b => { if(b) b.classList.add('active-theme', 'active'); }); lightBtns.forEach(b => { if(b) b.classList.remove('active-theme', 'active'); }); }
    if (!skipSave && auth.currentUser && !window.isGuest) { try { await updateDoc(doc(db, "users", auth.currentUser.uid), { "settings.theme": mode }); } catch (e) {} }
};

window.openAddFriendModal = function() { document.getElementById('add-friend-modal').classList.remove('hidden'); const err = document.getElementById('friend-error'); if(err) err.style.display='none'; const inp = document.getElementById('search-friend-input'); if(inp) inp.value=''; };
window.openRemoveFriendModal = function(friendName) { window.friendToRemove = friendName; document.getElementById('remove-friend-name').innerText = friendName; document.getElementById('remove-friend-modal').classList.remove('hidden'); };
window.closeFriendModal = function(id) { document.getElementById(id).classList.add('hidden'); };
window.openReviewRequestModal = function(requesterName) { window.friendToReview = requesterName; document.getElementById('request-sender-name').innerText = requesterName; window.toggleDropdown('noti-dropdown'); document.getElementById('review-request-modal').classList.remove('hidden'); };

window.sendFriendRequest = async function() {
    const targetUsername = document.getElementById('search-friend-input').value.trim().toLowerCase(); const errDiv = document.getElementById('friend-error'); if(!targetUsername) return;
    if(targetUsername === window.currentUserData.username_lower) { errDiv.innerText="لا يمكنك إضافة نفسك!"; errDiv.style.display='block'; return; }
    try {
        const q = query(collection(db, "users"), where("username_lower", "==", targetUsername));
        const snap = await getDocs(q);
        if(snap.empty) { errDiv.innerText="المستخدم غير موجود."; errDiv.style.display='block'; return; }
        const targetDocId = snap.docs[0].id; const myName = window.currentUserData.username || auth.currentUser.email.split('@')[0];
        await updateDoc(doc(db, "users", targetDocId), { friendRequests: arrayUnion(myName) });
        alert("تم إرسال الطلب بنجاح!"); window.closeFriendModal('add-friend-modal');
    } catch(e) { errDiv.innerText = "حدث خطأ في الإرسال."; errDiv.style.display='block'; }
};

window.processFriendRequest = async function(isAccepted) {
    if(!window.friendToReview) return; const reqName = window.friendToReview; window.closeFriendModal('review-request-modal');
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
        window.closeFriendModal('remove-friend-modal'); window.friendToRemove = null;
    } catch(e) { alert("حدث خطأ أثناء الحذف."); }
};

window.clearAuthInputs = function() { const form = document.getElementById('firebase-form'); if(form) form.reset(); const err = document.getElementById('auth-error'); if(err) err.style.display = 'none'; };

window.setFormType = function(type) { 
    window.currentFormMode = type; 
    const tLog = document.getElementById('tab-login'); if(tLog) tLog.classList.toggle('active', type === 'login'); 
    const tReg = document.getElementById('tab-register'); if(tReg) tReg.classList.toggle('active', type === 'register'); 
    const lFields = document.getElementById('login-fields'); if(lFields) lFields.style.display = type === 'login' ? 'block' : 'none'; 
    const rFields = document.getElementById('register-fields'); if(rFields) rFields.style.display = type === 'register' ? 'block' : 'none'; 
    
    document.getElementById('login-id').required = false; document.getElementById('login-password').required = false;
    document.getElementById('reg-username').required = false; document.getElementById('reg-email').required = false; document.getElementById('reg-password').required = false; document.getElementById('reg-confirm').required = false;
    
    const sBtn = document.getElementById('modal-submit-btn'); if(sBtn) sBtn.innerText = type === 'register' ? (window.translations ? window.translations[window.currentLang].confirm_register : "تأكيد الحساب") : (window.translations ? window.translations[window.currentLang].confirm_login : "تأكيد الدخول");
};

window.toggleDropdown = function(dropdownId, triggerElement) {
    const tgt = document.getElementById(dropdownId); const isOpen = tgt && tgt.classList.contains('show');
    document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show')); document.querySelectorAll('.header-icon-btn, .profile-trigger').forEach(t => t.classList.remove('active'));
    if (!isOpen && tgt) { tgt.classList.add('show'); if(triggerElement) triggerElement.classList.add('active'); }
};

window.onclick = function(e) { 
    if (!e.target.closest('.header-icon-btn') && !e.target.closest('.profile-trigger') && !e.target.closest('.header-dropdown') && !e.target.closest('.modal-card')) { 
        document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show')); document.querySelectorAll('.header-icon-btn, .profile-trigger').forEach(t => t.classList.remove('active')); 
    } 
};

window.handleLogout = function() { 
    signOut(auth).then(() => { 
        document.querySelectorAll('.header-dropdown').forEach(d => d.classList.remove('show'));
        document.body.removeAttribute('data-theme'); document.documentElement.className=''; document.body.className='';
        window.currentUserData = null; window.clearAuthInputs(); 
        const nameEl = document.getElementById('header-name'); if(nameEl) { nameEl.setAttribute('data-i18n', 'guest_name'); nameEl.innerText = window.translations[window.currentLang].guest_name; }
        const fallbackAvatar = document.getElementById('header-avatar-fallback'); if(fallbackAvatar) { fallbackAvatar.innerHTML = "ز"; fallbackAvatar.style.border = ''; }
        const wView = document.getElementById('modal-welcome-view'); if(wView) wView.style.display = 'block'; 
        const fView = document.getElementById('modal-form-view'); if(fView) fView.style.display = 'none';
        const aModal = document.getElementById('auth-modal'); if(aModal) aModal.classList.remove('hidden'); 
        const shell = document.getElementById('app-shell'); if(shell) shell.classList.remove('unlocked'); 
    }); 
};

window.switchModalMode = function(mode) { 
    if(mode === 'forms'){ 
        const wView = document.getElementById('modal-welcome-view'); if(wView) wView.style.display = 'none'; 
        const fView = document.getElementById('modal-form-view'); if(fView) fView.style.display = 'block'; 
    } 
};

window.openLoginDirectly = function() {
    const wView = document.getElementById('modal-welcome-view'); if(wView) wView.style.display = 'none'; 
    const fView = document.getElementById('modal-form-view'); if(fView) fView.style.display = 'block';
    window.setFormType('login'); 
    const aModal = document.getElementById('auth-modal'); if(aModal) aModal.classList.remove('hidden'); 
    const shell = document.getElementById('app-shell'); if(shell) shell.classList.remove('unlocked'); 
    window.toggleDropdown('');
};

window.enterAsGuest = function() {
    window.isGuest = true; window.currentUserData = null;
    const nameEl = document.getElementById('header-name'); if(nameEl) { nameEl.setAttribute('data-i18n', 'guest_name'); nameEl.innerText = window.translations[window.currentLang].guest_name; }
    const dropStat = document.getElementById('dropdown-status-name'); if(dropStat) dropStat.innerText = window.translations[window.currentLang].guest_status; 
    const avtFall = document.getElementById('header-avatar-fallback'); if(avtFall) { avtFall.innerHTML = "ز"; avtFall.style.border = ''; }
    window.renderFriendsList('friends-container-desktop'); window.renderNotifications();
    const dropContent = document.getElementById('dropdown-content-area'); if(dropContent) dropContent.innerHTML = `<button class="dropdown-item" onclick="window.openLoginDirectly()"><i class="ph ph-sign-in"></i> <span data-i18n="login_btn">${window.translations[window.currentLang].login_btn}</span></button>`;
    window.clearAuthInputs(); 
    const aModal = document.getElementById('auth-modal'); if(aModal) aModal.classList.add('hidden'); 
    const shell = document.getElementById('app-shell'); if(shell) shell.classList.add('unlocked'); 
    window.loadFragment('home', document.querySelector('.nav-btn.active'));
};

window.closeAuthModal = function() { 
    window.clearAuthInputs(); 
    const aModal = document.getElementById('auth-modal'); if(aModal) aModal.classList.add('hidden'); 
    const shell = document.getElementById('app-shell'); if(shell) shell.classList.add('unlocked'); 
    if(!window.isGuest) window.enterAsGuest(); 
};

window.switchModalMode = window.switchModalMode || switchModalMode;
window.openLoginDirectly = window.openLoginDirectly || openLoginDirectly;
window.enterAsGuest = window.enterAsGuest || enterAsGuest;
window.closeAuthModal = window.closeAuthModal || closeAuthModal;
window.setFormType = window.setFormType || setFormType;
window.toggleDropdown = window.toggleDropdown || toggleDropdown;

window.loadFragment = async function(pageName, element) {
    const contentHolder = document.getElementById('content-holder');
    const titles = { 'home': 'title_home', 'play': 'title_play', 'achievements': 'title_achievements', 'store': 'title_store', 'friends': 'title_friends', 'profile': 'title_profile' };
    
    const pt = document.getElementById('page-title'); 
    const mn = document.getElementById('mobile-section-name'); 
    
    if (titles[pageName] && window.translations) {
        if(pt) pt.innerText = window.translations[window.currentLang][titles[pageName]];
        if(mn) mn.innerText = window.translations[window.currentLang][titles[pageName]];
    } else {
        if(pt) pt.innerText = '';
        if(mn) mn.innerText = '';
    }
    
    document.querySelectorAll('.nav-btn, .bottom-tab').forEach(btn => { 
        btn.classList.remove('active'); 
        const icon = btn.querySelector('i'); 
        if(icon) icon.className = icon.className.replace('ph-fill', 'ph'); 
    });

    if(element) {
        element.classList.add('active'); 
        const icon = element.querySelector('i'); 
        if(icon) icon.className = icon.className.replace('ph', 'ph-fill');
        
        const isNav = element.classList.contains('nav-btn');
        const tabsList = isNav ? document.querySelectorAll('.nav-btn') : document.querySelectorAll('.bottom-tab');
        const targetList = isNav ? document.querySelectorAll('.bottom-tab') : document.querySelectorAll('.nav-btn');
        const index = Array.from(tabsList).indexOf(element);
        
        if(pageName === 'friends' && !isNav) {} 
        else if (pageName === 'store' && isNav) { const mStore = document.querySelectorAll('.bottom-tab')[3]; if(mStore) { mStore.classList.add('active'); mStore.querySelector('i').className = mStore.querySelector('i').className.replace('ph', 'ph-fill'); } }
        else if (pageName === 'profile' && isNav) { const mProf = document.querySelectorAll('.bottom-tab')[5]; if(mProf) { mProf.classList.add('active'); mProf.querySelector('i').className = mProf.querySelector('i').className.replace('ph', 'ph-fill'); } }
        else { const matchedTab = targetList[index]; if(matchedTab) { matchedTab.classList.add('active'); matchedTab.querySelector('i').className = matchedTab.querySelector('i').className.replace('ph', 'ph-fill'); } }
    }

    if(contentHolder) contentHolder.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100%;"><div class="spinner" style="width:30px; height:30px;"></div></div>';

    try {
        const response = await fetch(`pages/${pageName}.html`);
        if (!response.ok) throw new Error('Page not found');
        
        const htmlContent = await response.text();
        if(contentHolder) contentHolder.innerHTML = htmlContent;

        const scripts = contentHolder.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });

        if(window.setLanguage) window.setLanguage(window.currentLang, true);

        // هنا نمرر true ليتم عرض شكل الأمبلم الكامل عند فتح صفحة الجوال للأصدقاء
        if (pageName === 'friends') {
            window.renderFriendsList('mobile-friends-wrapper', true);
        }

    } catch (error) {
        if(contentHolder && window.translations) contentHolder.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:var(--text-dim); font-size:1.2rem; font-weight:bold;">جاري العمل على صفحة ${window.translations[window.currentLang][titles[pageName]]}...</div>`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('firebase-form');
    if (authForm) {
        authForm.setAttribute('novalidate', 'true');
        authForm.addEventListener('submit', window.handleAuthSubmit);
    }
    if(window.setFormType) window.setFormType('login');
});
