// ==========================================
// 1. المتغيرات العامة (Global State)
// ==========================================
window.isGuest = false; 
window.currentFormMode = 'login'; 
window.currentUserData = null; 
window.friendToRemove = null; 
window.friendToReview = null;
window.unsubscribeSnapshot = null; 
window.currentLang = 'ar';
window.friendsCache = {};
window.friendListeners = {};

window.hideLoader = () => { 
    const l = document.getElementById('global-loader'); 
    if(l){ l.style.opacity = '0'; setTimeout(() => l.style.visibility = 'hidden', 400); } 
};

// ==========================================
// 2. تصميمات النوافذ (CSS Injection)
// ==========================================
const style = document.createElement('style');
style.innerHTML = `
    @keyframes smoothScaleIn {
        0% { opacity: 0; transform: scale(0.95) translateY(10px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modern-action-btn { background: rgba(255,255,255,0.03); color: var(--text-main); border: 1px solid rgba(255,255,255,0.08); padding: 14px; border-radius: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 0.9rem; backdrop-filter: blur(10px); position: relative; overflow: hidden; }
    .modern-action-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); }
    .modern-action-btn:active { transform: translateY(0) scale(0.98); }
    
    .modern-danger-btn { background: rgba(255, 76, 106, 0.05); color: var(--accent-red); border: 1px solid rgba(255, 76, 106, 0.2); padding: 14px; border-radius: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 0.9rem; }
    .modern-danger-btn:hover { background: var(--accent-red); color: white; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(255, 76, 106, 0.3); border-color: var(--accent-red); }
    .modern-danger-btn:active { transform: translateY(0) scale(0.98); }
    
    .friend-data-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(12px); z-index: 1000000; display: flex; justify-content: center; align-items: center; animation: smoothFadeIn 0.2s ease; padding: 20px; }
    .friend-data-card { background: var(--surface-panel); width: 100%; max-width: 450px; border-radius: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08); overflow: hidden; animation: smoothScaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; position: relative; }
    .locked-view-msg { padding: 50px 20px; text-align: center; color: var(--text-dim); display: flex; flex-direction: column; align-items: center; gap: 15px; background: rgba(0,0,0,0.2); border-radius: 20px; margin: 20px; border: 1px dashed rgba(255,255,255,0.1); }
`;
document.head.appendChild(style);

// ==========================================
// 3. دوال رسم واجهة الأصدقاء والنوافذ
// ==========================================
window.drawFriendsUI = function() {
    try {
        const desktopContainer = document.getElementById('friends-container-desktop');
        const mobileContainer = document.getElementById('mobile-friends-wrapper');
        const friendsArray = (window.currentUserData && Array.isArray(window.currentUserData.friends)) ? window.currentUserData.friends : [];

        if (desktopContainer) {
            if (window.isGuest || !window.currentUserData) {
                desktopContainer.innerHTML = `<div class="guest-friends-msg"><i class="ph-duotone ph-lock-key"></i><span>يجب تسجيل الدخول</span></div>`;
            } else if (friendsArray.length === 0) {
                desktopContainer.innerHTML = `<div class="friends-header">الأصدقاء</div><button class="add-friend-btn" onclick="window.openAddFriendModal()"><i class="ph-bold ph-plus"></i></button>`;
            } else {
                let dHtml = `<div class="friends-header">الأصدقاء</div><div style="display:flex; flex-direction:column; gap:15px; align-items:center; width:100%;">`;
                friendsArray.forEach(fName => {
                    if (!fName || typeof fName !== 'string') return;
                    try {
                        const fData = window.friendsCache[fName] || { username: fName };
                        const safeName = fData.username || fName;
                        let avatarHtml = `<div style="width:100%; height:100%; border-radius:50%; background:var(--surface-panel); display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:16px; color:var(--text-main);">${safeName.charAt(0).toUpperCase()}</div>`;
                        if (fData.avatar) avatarHtml = `<img src="${fData.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                        
                        let dotColor = 'var(--accent-green)';
                        if(fData.status === 'offline') dotColor = 'gray';
                        else if(fData.status === 'away') dotColor = 'orange';

                        dHtml += `<div class="friend-avatar" onclick="window.openFriendActionModal('${fName}', event, false)">${avatarHtml}<div class="online-dot" style="background: ${dotColor}"></div></div>`;
                    } catch(e) {}
                });
                dHtml += `</div><button class="add-friend-btn" onclick="window.openAddFriendModal()"><i class="ph-bold ph-plus"></i></button>`;
                desktopContainer.innerHTML = dHtml;
            }
        }

        if (mobileContainer) {
            if (window.isGuest || !window.currentUserData) {
                mobileContainer.innerHTML = `<div class="empty-content-box" style="height: 100%; border:none; justify-content:center;"><i class="ph-duotone ph-lock-key"></i><span>يجب تسجيل الدخول لإضافة الأصدقاء ورؤيتهم.</span></div>`;
            } else if (friendsArray.length === 0) {
                mobileContainer.innerHTML = `<div class="empty-content-box" style="height: 100%; border:none; justify-content:center;"><i class="ph-duotone ph-users-slash"></i><span>قائمة الأصدقاء فارغة. قم بإضافة أصدقاء جدد!</span></div>`;
            } else {
                let mHtml = '';
                friendsArray.forEach(fName => {
                    if (!fName || typeof fName !== 'string') return;
                    try {
                        const fData = window.friendsCache[fName] || { username: fName, emblem: '', badge: 'beginner', title: '' };
                        const safeName = fData.username || fName;
                        
                        let avatarInner = `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center;">${safeName.charAt(0).toUpperCase()}</div>`;
                        if (fData.avatar) avatarInner = `<img src="${fData.avatar}">`;
                        
                        let emblemHTML = window.UI_COMPONENTS ? window.UI_COMPONENTS.buildEmblemCard(fData, "80px", true) : '';
                        
                        let dotColor = 'var(--accent-green)';
                        let shadowColor = 'rgba(46, 204, 113, 0.5)';
                        if(fData.status === 'offline') { dotColor = 'gray'; shadowColor = 'rgba(100,100,100,0.5)'; }
                        else if(fData.status === 'away') { dotColor = 'orange'; shadowColor = 'rgba(255, 165, 0, 0.5)'; }

                        mHtml += `
                            <div class="friend-row" onclick="window.openFriendActionModal('${fName}', event, true)">
                                <div class="friend-avatar-outside">
                                    ${avatarInner}
                                    <div class="online-dot-large" style="background: ${dotColor}; box-shadow: 0 0 10px ${shadowColor};"></div>
                                </div>
                                <div style="flex: 1; transition: 0.3s;" class="hover-emblem-wrap">
                                    ${emblemHTML}
                                </div>
                            </div>
                        `;
                    } catch(e) {}
                });
                mobileContainer.innerHTML = mHtml;
            }
        }
    } catch (err) {}
};

window.openFriendActionModal = function(friendName, event, isMobile) {
    try {
        let existingPopover = document.getElementById('friend-popover');
        if (existingPopover && existingPopover.getAttribute('data-friend') === friendName) { existingPopover.remove(); return; }

        if(existingPopover) existingPopover.remove();
        let existingModal = document.getElementById('dynamic-friend-modal');
        if(existingModal) existingModal.remove();

        const friendData = window.friendsCache[friendName] || { username: friendName, emblem: '', badge: 'beginner', title: '' };

        const actionButtons = `
            <div style="padding: 20px; display: flex; flex-direction: column; gap: 12px; background: linear-gradient(180deg, var(--surface-panel) 0%, var(--bg-base) 100%);">
                <button class="modern-action-btn" onclick="document.getElementById('${isMobile ? 'dynamic-friend-modal' : 'friend-popover'}').remove(); window.viewFriendProfile('${friendName}');"><i class="ph-bold ph-user-circle" style="font-size:1.2rem;"></i> عرض الملف الشخصي</button>
                <button class="modern-action-btn" onclick="document.getElementById('${isMobile ? 'dynamic-friend-modal' : 'friend-popover'}').remove(); window.viewFriendHistory('${friendName}');"><i class="ph-bold ph-clock-counter-clockwise" style="font-size:1.2rem;"></i> سجل المباريات</button>
                <button class="modern-danger-btn" onclick="document.getElementById('${isMobile ? 'dynamic-friend-modal' : 'friend-popover'}').remove(); window.openRemoveFriendModal('${friendName}');"><i class="ph-bold ph-user-minus" style="font-size:1.2rem;"></i> حذف الصديق</button>
            </div>
        `;

        if (isMobile) {
            const emblemHTML = window.UI_COMPONENTS.buildEmblemCard(friendData, "95px", true);
            const modalHtml = `
                <div class="profile-modal-content friend-data-card" style="padding: 0; width: 95%;">
                    <button onclick="document.getElementById('dynamic-friend-modal').remove()" style="position: absolute; top: 15px; right: 15px; z-index: 100; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; backdrop-filter: blur(8px); transition: 0.2s;"><i class="ph-bold ph-x"></i></button>
                    ${emblemHTML}
                    ${actionButtons}
                </div>
            `;
            const modal = document.createElement('div');
            modal.id = 'dynamic-friend-modal';
            modal.className = 'friend-data-modal';
            modal.onclick = function(e) { if(e.target === modal) modal.remove(); };
            modal.innerHTML = modalHtml;
            document.body.appendChild(modal);

        } else {
            const rect = event.currentTarget.getBoundingClientRect();
            let leftPos = rect.right + 15;
            if (leftPos + 360 > window.innerWidth) { leftPos = rect.left - 360 - 15; }
            let topPos = rect.top;
            if (topPos + 380 > window.innerHeight) { topPos = window.innerHeight - 380; }

            const popover = document.createElement('div');
            popover.id = 'friend-popover';
            popover.setAttribute('data-friend', friendName);
            popover.style.cssText = `position: fixed; top: ${topPos}px; left: ${leftPos}px; width: 360px; background: var(--surface-panel); border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.4); z-index: 100000; overflow: hidden; animation: smoothScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; border: 1px solid rgba(255,255,255,0.08);`;
            
            const emblemHTML = window.UI_COMPONENTS.buildEmblemCard(friendData, "100px", true);

            popover.innerHTML = `
                ${emblemHTML}
                ${actionButtons}
            `;
            document.body.appendChild(popover);
        }
    } catch (err) { console.error("Error in openFriendActionModal:", err); }
};

window.checkFriendPrivacy = function(friendData, privacyType) {
    if(!friendData) return false;
    let privacy = friendData['privacy_' + privacyType] || 'all';
    if(privacy === 'nobody') return false;
    if(privacy === 'all') return true;
    if(privacy === 'friends') {
        let myName = window.currentUserData.username;
        return (friendData.friends && friendData.friends.includes(myName));
    }
    return true;
};

window.viewFriendProfile = function(fName) {
    try {
        const fData = window.friendsCache[fName] || { username: fName };
        const canView = window.checkFriendPrivacy(fData, 'profile');
        
        let contentHtml = '';
        if(!canView) {
            contentHtml = `<div class="locked-view-msg"><i class="ph-duotone ph-lock-key" style="font-size:4.5rem; color:var(--accent-red); margin-bottom: 10px;"></i><h3 style="color:white; font-size:1.4rem;">البروفايل خاص</h3><p style="font-size:0.9rem;">هذا المستخدم قام بتقييد من يمكنه رؤية بروفايله.</p></div>`;
        } else {
            let lvl = fData.level || 1;
            let xp = fData.xp || 0;
            let achievements = 0; 
            contentHtml = `
                <div style="padding: 25px; display: flex; flex-direction: column; gap: 20px; background: var(--bg-base);">
                    <div style="display: flex; flex-direction: column; align-items: center; background: var(--surface-panel); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 30px 15px; box-shadow: inset 0 0 20px rgba(0,0,0,0.2);">
                        <div style="width: 100px; height: 110px; background: linear-gradient(135deg, var(--accent-red), #ff8a9f); clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; position: relative; margin-bottom: 15px; box-shadow: 0 15px 30px rgba(255, 76, 106, 0.3);">
                            <div style="position: absolute; inset: 4px; background: var(--surface-panel); clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); z-index: 1;"></div>
                            <span style="position: relative; z-index: 2; font-size: 2.8rem; font-weight: 900; font-family: var(--font-en); background: linear-gradient(135deg, var(--accent-red), #ff8a9f); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${lvl}</span>
                            <span style="position: relative; z-index: 2; font-size: 0.75rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; margin-top: -5px; letter-spacing: 1px;">Level</span>
                        </div>
                        <div style="font-size: 0.9rem; font-weight: bold; color: var(--text-dim); font-family: var(--font-en); background: rgba(255,255,255,0.03); padding: 8px 20px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.05);">XP: ${xp}</div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; background: var(--surface-panel); padding: 20px 25px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        <span style="color: var(--text-dim); font-weight: bold; font-size: 1.1rem; display: flex; align-items: center; gap: 10px;"><i class="ph-fill ph-medal" style="font-size: 1.4rem; color: gold;"></i> الإنجازات</span>
                        <span style="color: var(--text-main); font-weight: 900; font-family: var(--font-en); font-size: 1.5rem;">${achievements}</span>
                    </div>
                </div>
            `;
        }

        const emblemHTML = window.UI_COMPONENTS.buildEmblemCard(fData, "120px", true);
        
        const modal = document.createElement('div');
        modal.className = 'friend-data-modal';
        modal.innerHTML = `
            <div class="friend-data-card" style="max-width: 500px;">
                <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 15px; right: 15px; z-index: 100; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: white; width: 38px; height: 38px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; backdrop-filter: blur(8px); transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);"><i class="ph-bold ph-x"></i></button>
                ${emblemHTML}
                ${contentHtml}
            </div>
        `;
        modal.onclick = function(e) { if(e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    } catch (e) { console.error("Error viewing profile:", e); }
};

window.viewFriendHistory = function(fName) {
    try {
        const fData = window.friendsCache[fName] || { username: fName };
        const canView = window.checkFriendPrivacy(fData, 'history');
        
        let contentHtml = '';
        if(!canView) {
            contentHtml = `<div class="locked-view-msg"><i class="ph-duotone ph-lock-key" style="font-size:4.5rem; color:var(--accent-red); margin-bottom: 10px;"></i><h3 style="color:white; font-size:1.4rem;">السجل خاص</h3><p style="font-size:0.9rem;">هذا المستخدم قام بتقييد من يمكنه رؤية إحصائياته.</p></div>`;
        } else {
            let m = fData.matches || 0;
            let w = fData.wins || 0;
            let l = m - w;
            let wr = m > 0 ? Math.round((w/m)*100) + '%' : '0%';
            
            contentHtml = `
                <div style="padding: 25px; display: flex; flex-direction: column; gap: 20px; background: var(--bg-base);">
                    <h4 style="color: var(--text-main); margin-bottom: -5px; display: flex; align-items: center; gap: 10px; font-size: 1.1rem;"><i class="ph-fill ph-chart-bar" style="color: var(--accent-red); font-size: 1.4rem;"></i> الإحصائيات العامة</h4>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
                        <div style="background: var(--surface-panel); padding: 20px 5px; border-radius: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.05); box-shadow: inset 0 0 15px rgba(0,0,0,0.2);">
                            <div style="font-size: 1.5rem; font-weight: 900; color: white; font-family: var(--font-en);">${m}</div>
                            <div style="font-size: 0.7rem; color: var(--text-dim); font-weight: bold; margin-top: 5px;">مباريات</div>
                        </div>
                        <div style="background: var(--surface-panel); padding: 20px 5px; border-radius: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.05); box-shadow: inset 0 0 15px rgba(0,0,0,0.2);">
                            <div style="font-size: 1.5rem; font-weight: 900; color: var(--accent-green); font-family: var(--font-en);">${w}</div>
                            <div style="font-size: 0.7rem; color: var(--text-dim); font-weight: bold; margin-top: 5px;">فوز</div>
                        </div>
                        <div style="background: var(--surface-panel); padding: 20px 5px; border-radius: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.05); box-shadow: inset 0 0 15px rgba(0,0,0,0.2);">
                            <div style="font-size: 1.5rem; font-weight: 900; color: var(--accent-red); font-family: var(--font-en);">${l}</div>
                            <div style="font-size: 0.7rem; color: var(--text-dim); font-weight: bold; margin-top: 5px;">خسارة</div>
                        </div>
                        <div style="background: var(--surface-panel); padding: 20px 5px; border-radius: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.05); box-shadow: inset 0 0 15px rgba(0,0,0,0.2);">
                            <div style="font-size: 1.5rem; font-weight: 900; color: gold; font-family: var(--font-en);">${wr}</div>
                            <div style="font-size: 0.7rem; color: var(--text-dim); font-weight: bold; margin-top: 5px;">نسبة</div>
                        </div>
                    </div>
                    
                    <h4 style="color: var(--text-main); margin-top: 15px; margin-bottom: -5px; display: flex; align-items: center; gap: 10px; font-size: 1.1rem;"><i class="ph-fill ph-clock-counter-clockwise" style="color: var(--accent-red); font-size: 1.4rem;"></i> آخر المباريات</h4>
                    <div style="background: var(--surface-panel); border-radius: 20px; padding: 40px 20px; text-align: center; border: 1px dashed rgba(255,255,255,0.1); color: var(--text-dim); box-shadow: inset 0 0 20px rgba(0,0,0,0.1);">
                        لا توجد مباريات مسجلة بعد.
                    </div>
                    <button class="modern-action-btn" style="margin-top: 5px;" onclick="alert('سيتم إظهار آخر 10 مباريات')">عرض المزيد</button>
                </div>
            `;
        }

        const emblemHTML = window.UI_COMPONENTS.buildEmblemCard(fData, "120px", true);
        
        const modal = document.createElement('div');
        modal.className = 'friend-data-modal';
        modal.innerHTML = `
            <div class="friend-data-card" style="max-width: 550px;">
                <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 15px; right: 15px; z-index: 100; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: white; width: 38px; height: 38px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; backdrop-filter: blur(8px); transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);"><i class="ph-bold ph-x"></i></button>
                ${emblemHTML}
                ${contentHtml}
            </div>
        `;
        modal.onclick = function(e) { if(e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    } catch(e) { console.error("Error viewing history", e); }
};

window.renderNotifications = function() {
    const list = document.getElementById('noti-list'); const dot = document.getElementById('noti-dot');
    if(!list || !dot) return;
    if (window.isGuest || !window.currentUserData || !window.currentUserData.friendRequests || window.currentUserData.friendRequests.length === 0) {
        list.innerHTML = `<div class="empty-state"><i class="ph-duotone ph-bell-slash"></i><span>لا يوجد تنبيهات حالياً</span></div>`;
        dot.style.display = 'none'; return;
    }
    dot.style.display = 'block'; let html = '';
    window.currentUserData.friendRequests.forEach(req => {
        html += `<div class="noti-item" onclick="window.openReviewRequestModal('${req}')"><div class="noti-icon"><i class="ph-bold ph-user-plus"></i></div><div class="noti-text-content"><span class="noti-text"><span>طلب صداقة جديد من</span> <strong>${req}</strong></span><span class="noti-time">الآن</span></div></div>`;
    });
    list.innerHTML = html;
};

// ==========================================
// 4. دوال التحكم بإعدادات الواجهة (Settings)
// ==========================================
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
    window.renderNotifications(); window.drawFriendsUI();
    
    const activeBtn = document.querySelector('.nav-btn.active');
    if(activeBtn) {
        const pageId = Array.from(document.querySelectorAll('.nav-btn')).indexOf(activeBtn); const pages = ['home', 'play', 'achievements', 'store', 'profile'];
        if(pages[pageId]) { const pt = document.getElementById('page-title'); if(pt) pt.innerText = window.translations[lang]['title_' + pages[pageId]]; const mn = document.getElementById('mobile-section-name'); if(mn) mn.innerText = window.translations[lang]['title_' + pages[pageId]]; }
    }
    if (!skipSave && window.authInstance && window.authInstance.currentUser && !window.isGuest) { 
        try { await window.updateDocFunc(window.docFunc(window.dbInstance, "users", window.authInstance.currentUser.uid), { "settings.language": lang }); } catch(e){} 
    }
};

window.setFontSize = async function(size, skipSave = false) {
    document.documentElement.classList.remove('font-small', 'font-large'); if(size !== 'default') document.documentElement.classList.add(`font-${size}`);
    document.querySelectorAll('#font-small, #font-default, #font-large').forEach(b => b.classList.remove('active')); const sizeBtn = document.getElementById(`font-${size}`); if(sizeBtn) sizeBtn.classList.add('active');
    if (!skipSave && window.authInstance && window.authInstance.currentUser && !window.isGuest) { 
        try { await window.updateDocFunc(window.docFunc(window.dbInstance, "users", window.authInstance.currentUser.uid), { "settings.fontSize": size }); } catch(e){} 
    }
};

window.setAnimation = async function(isOn, skipSave = false) {
    if(isOn) document.body.classList.remove('no-animations'); else document.body.classList.add('no-animations');
    const animOn = document.getElementById('anim-on'); if(animOn) animOn.classList.toggle('active', isOn); const animOff = document.getElementById('anim-off'); if(animOff) animOff.classList.toggle('active', !isOn);
    if (!skipSave && window.authInstance && window.authInstance.currentUser && !window.isGuest) { 
        try { await window.updateDocFunc(window.docFunc(window.dbInstance, "users", window.authInstance.currentUser.uid), { "settings.animations": isOn }); } catch(e){} 
    }
};

window.toggleTheme = async function(mode, skipSave = false) {
    const body = document.body; const darkBtns = [document.getElementById('btn-theme-dark'), document.getElementById('mini-theme-dark')]; const lightBtns = [document.getElementById('btn-theme-light'), document.getElementById('mini-theme-light')];
    if (mode === 'light') { body.setAttribute('data-theme', 'light'); lightBtns.forEach(b => { if(b) b.classList.add('active-theme', 'active'); }); darkBtns.forEach(b => { if(b) b.classList.remove('active-theme', 'active'); }); } 
    else { body.removeAttribute('data-theme'); darkBtns.forEach(b => { if(b) b.classList.add('active-theme', 'active'); }); lightBtns.forEach(b => { if(b) b.classList.remove('active-theme', 'active'); }); }
    if (!skipSave && window.authInstance && window.authInstance.currentUser && !window.isGuest) { 
        try { await window.updateDocFunc(window.docFunc(window.dbInstance, "users", window.authInstance.currentUser.uid), { "settings.theme": mode }); } catch (e) {} 
    }
};

// ==========================================
// 5. دوال التفاعل مع النوافذ (Modals & Menus)
// ==========================================
window.openAddFriendModal = function() { document.getElementById('add-friend-modal').classList.remove('hidden'); const err = document.getElementById('friend-error'); if(err) err.style.display='none'; const inp = document.getElementById('search-friend-input'); if(inp) inp.value=''; };
window.openRemoveFriendModal = function(friendName) { window.friendToRemove = friendName; document.getElementById('remove-friend-name').innerText = friendName; document.getElementById('remove-friend-modal').classList.remove('hidden'); };
window.closeFriendModal = function(id) { document.getElementById(id).classList.add('hidden'); };
window.openReviewRequestModal = function(requesterName) { window.friendToReview = requesterName; document.getElementById('request-sender-name').innerText = requesterName; window.toggleDropdown('noti-dropdown'); document.getElementById('review-request-modal').classList.remove('hidden'); };

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
    if (!e.target.closest('#friend-popover') && !e.target.closest('.friend-avatar')) {
        const pop = document.getElementById('friend-popover');
        if (pop) pop.remove();
    }
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
    const nameEl = document.getElementById('header-name'); if(nameEl) { nameEl.setAttribute('data-i18n', 'guest_name'); nameEl.innerText = "زائر"; }
    const dropStat = document.getElementById('dropdown-status-name'); if(dropStat) dropStat.innerText = "غير مسجل"; 
    const avtFall = document.getElementById('header-avatar-fallback'); if(avtFall) { avtFall.innerHTML = "ز"; avtFall.style.border = ''; }
    
    // من هنا نستدعي دالة الفايربيس 
    if(window.setupRealtimeFriends) window.setupRealtimeFriends(); 
    window.renderNotifications();
    
    const dropContent = document.getElementById('dropdown-content-area'); if(dropContent) dropContent.innerHTML = `<button class="dropdown-item" onclick="window.openLoginDirectly()"><i class="ph ph-sign-in"></i> <span>تسجيل الدخول</span></button>`;
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

// ==========================================
// 6. نظام التنقل الذكي (Smart Routing & State Management)
// ==========================================
window.loadFragment = async function(pageName, element) {
    // [1] خريطة الفروع وأصولها: نعرّف كل فرع لأي قسم ينتمي
    const parentTabs = {
        'home': 'home',
        'play': 'play',
        'lobby': 'play', // اللوبي يتبع لقسم اللعب
        'achievements': 'achievements',
        'store': 'store',
        'friends': 'friends',
        'profile': 'profile',
        'customization': 'profile' // التخصيص يتبع للبروفايل
    };

    let parentTab = parentTabs[pageName] || pageName;

    // [2] استعادة الصفحة الفرعية: إذا ضغطت على زر القسم الرئيسي، هل كنت في فرع معين داخله مسبقاً؟
    if (Object.values(parentTabs).includes(pageName) && pageName === parentTab) {
        let savedSub = sessionStorage.getItem('savedTab_' + pageName);
        let lastPage = sessionStorage.getItem('lastActivePage');
        
        if (savedSub && savedSub !== pageName) {
             // [العودة الذكية للوراء]: إذا كنت داخل التخصيص، وضغطت أيقونة البروفايل مرة أخرى، يمسح الحفظ ويعيدك لجذر البروفايل
             if (parentTabs[lastPage] === pageName) {
                 sessionStorage.removeItem('savedTab_' + pageName);
                 savedSub = null;
             } else {
                 // غير ذلك (مثلاً رجعت من الرئيسية)، يعيدك للصفحة الفرعية التي توقفت عندها (التخصيص)
                 pageName = savedSub;
                 parentTab = parentTabs[pageName] || pageName;
             }
        }
    }

    // [3] استثناء أمان للغرفة: إذا كنت تملك غرفة نشطة وضغطت على "اللعب"، لا ترجع للشاشة الرئيسية بل للوبي مباشرة
    if (parentTab === 'play' && window.currentRoomId) {
        pageName = 'lobby';
        parentTab = 'play';
    }

    // [4] حفظ مسارك الحالي في الجلسة ليتم تذكره لاحقاً
    sessionStorage.setItem('lastActivePage', pageName);
    sessionStorage.setItem('savedTab_' + parentTab, pageName);

    const contentHolder = document.getElementById('content-holder');
    
    // قائمة العناوين لتحديث عنوان الصفحة فوق
    const titles = { 'home': 'title_home', 'play': 'title_play', 'achievements': 'title_achievements', 'store': 'title_store', 'friends': 'title_friends', 'profile': 'title_profile', 'customization': 'advanced_customization', 'lobby': 'title_play' };
    
    const pt = document.getElementById('page-title'); 
    const mn = document.getElementById('mobile-section-name'); 
    
    if (titles[pageName] && window.translations && window.translations[window.currentLang]) {
        if(pt) pt.innerText = window.translations[window.currentLang][titles[pageName]] || '';
        if(mn) mn.innerText = window.translations[window.currentLang][titles[pageName]] || '';
    } else {
        if(pt) pt.innerText = '';
        if(mn) mn.innerText = '';
    }
    
    // [5] نظام إضاءة الأزرار الذكي: يبحث عن الأصل ويضيئه حتى لو كنت داخل صفحة فرعية!
    document.querySelectorAll('.nav-btn, .bottom-tab').forEach(btn => { 
        btn.classList.remove('active'); 
        const icon = btn.querySelector('i'); 
        if(icon) icon.className = icon.className.replace('ph-fill', 'ph'); 
    });

    const mainTabsList = ['home', 'play', 'achievements', 'store', 'friends', 'profile'];
    const tabIndex = mainTabsList.indexOf(parentTab); // يبحث عن رقم الأصل بدلاً من الفرع

    if (tabIndex !== -1) {
        // إضاءة أزرار سطح المكتب
        const desktopNavs = document.querySelectorAll('.nav-btn');
        if (desktopNavs[tabIndex]) {
            desktopNavs[tabIndex].classList.add('active');
            const icon = desktopNavs[tabIndex].querySelector('i');
            if(icon) icon.className = icon.className.replace('ph', 'ph-fill');
        }
        
        // إضاءة أزرار الجوال
        const mobileNavs = document.querySelectorAll('.bottom-tab');
        if (mobileNavs[tabIndex]) {
            mobileNavs[tabIndex].classList.add('active');
            const icon = mobileNavs[tabIndex].querySelector('i');
            if(icon) icon.className = icon.className.replace('ph', 'ph-fill');
        }
    }

    // [6] جلب محتوى الصفحة وعرضها بشكل سلس
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

        if (pageName === 'friends' && window.drawFriendsUI) {
            window.drawFriendsUI();
        }
        
        if (pageName === 'lobby' && window.fetchAndRenderLobbyPlayers) {
            window.fetchAndRenderLobbyPlayers(); 
        }

    } catch (error) {
        if(contentHolder && window.translations) contentHolder.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:var(--text-dim); font-size:1.2rem; font-weight:bold;">جاري العمل على صفحة ${window.translations[window.currentLang][titles[pageName]] || 'هذه الصفحة'}...</div>`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('firebase-form');
    if (authForm) {
        authForm.setAttribute('novalidate', 'true');
    }
    if(window.setFormType) window.setFormType('login');
});
