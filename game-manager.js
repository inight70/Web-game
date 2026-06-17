// ========================================================================
// DECEPTION - CORE ISOLATED GAME ENGINE (WITH SESSION RECOVERY)
// ========================================================================

window.GameEngine = {
    roomInGameListenerUnsub: null,
    cachedGameStateData: null,

    // دالة إدارة الأزرار في القوائم الأساسية وتبديل الألواح
    switchGameTab: function(tabId, clickedBtn) {
        document.querySelectorAll('.game-nav-tab').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.game-tab-panel').forEach(panel => panel.classList.remove('active'));
        
        // تفعيل الزر في كلتا القائمتين (سطح المكتب والجوال) لضمان التزامن
        let deskBtn = document.getElementById('desk-tab-' + tabId);
        let mobBtn = document.getElementById('mob-tab-' + tabId);
        if(deskBtn) deskBtn.classList.add('active');
        if(mobBtn) mobBtn.classList.add('active');

        const targetPanel = document.getElementById(`game-panel-${tabId}`);
        if (targetPanel) { targetPanel.classList.add('active'); }
        
        if (tabId === 'court') this.buildCourtRoomUI();
        if (tabId === 'tools') this.buildToolsAndEvidenceUI();
        if (tabId === 'settings') this.buildSettingsPlayersUI();
    },

    // نظام الاسترداد اللحظي عند تسجيل الدخول
    recoverGameSession: async function(usernameLower) {
        try {
            const { getDocs, query, collection, where } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            // البحث عن اللاعب في أي غرفة نشطة
            const q = query(collection(window.dbInstance, "rooms"), where("players", "array-contains", usernameLower));
            const snap = await getDocs(q);
            
            if (!snap.empty) {
                const roomData = snap.docs[0].data();
                window.currentRoomId = roomData.id;
                window.currentRoomData = roomData;
                
                // إعادة ربط المراقب الأساسي للغرفة
                if(window.listenToRoom) window.listenToRoom();

                // إذا كانت الغرفة في وضع اللعب، انقله فوراً
                if (roomData.status === 'playing') {
                    document.body.classList.add('in-game');
                    if (window.loadFragment) window.loadFragment('game');
                } else {
                    if (window.loadFragment) window.loadFragment('lobby');
                }
            }
        } catch (e) { console.error("Recovery failed:", e); }
    },

    initiateGameStart: async function() {
        if (!window.currentRoomId || !window.currentRoomData) return;
        const currentPlayersArray = window.currentRoomData.players || [];
        
        let dynamicShuffledPlayers = [...currentPlayersArray].sort(() => Math.random() - 0.5);
        let allocatedRolesMap = {};
        
        if (dynamicShuffledPlayers[0]) allocatedRolesMap[dynamicShuffledPlayers[0]] = 'forensic';
        if (dynamicShuffledPlayers[1]) allocatedRolesMap[dynamicShuffledPlayers[1]] = 'murderer';
        for (let index = 2; index < dynamicShuffledPlayers.length; index++) {
            allocatedRolesMap[dynamicShuffledPlayers[index]] = 'investigator';
        }

        const pureWeaponsPool = ['مسدس كاتم', 'سكين حاد', 'سم زئبقي', 'حبل مشنقة', 'فأس صدئ', 'وسادة قطنية', 'سلك كهربائي', 'بندقية صيد', 'خنجر أثري', 'حقنة قاتلة'];
        const pureEvidencePool = ['بقعة دم', 'بصمة إبهام', 'كأس مكسور', 'رسالة تهديد', 'شعر طويل', 'ساعة متوقفة', 'خاتم ذهبي', 'كمامة طبية', 'قلم ملوث', 'حقيبة جلدية'];

        let assignedPlayerItemsDatabase = {};
        currentPlayersArray.forEach(playerNameKey => {
            assignedPlayerItemsDatabase[playerNameKey] = {
                weapons: [...pureWeaponsPool].sort(() => Math.random() - 0.5).slice(0, 4),
                evidence: [...pureEvidencePool].sort(() => Math.random() - 0.5).slice(0, 4)
            };
        });

        try {
            const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            await updateDoc(doc(window.dbInstance, "rooms", window.currentRoomId), {
                status: 'playing', currentRound: 1, roles: allocatedRolesMap,
                playerItems: assignedPlayerItemsDatabase, accusationsUsed: {},
                cluesBoard: [
                    { tileName: 'مكان الجريمة الرئيسي', value: 'بانتظار اختيار الطبيب الشرعي...' },
                    { tileName: 'سبب الوفاة المباشر', value: 'بانتظار تشريح الجثة...' }
                ],
                actionsHistoryLog: ['تم قفل الغرفة بنجاح وبدأت الجولة الأولى.']
            });
            document.body.classList.add('in-game');
            if (window.loadFragment) window.loadFragment('game');
        } catch (error) { console.error("Game Start Error:", error); }
    },

    activateInGameRealtimeListener: function() {
        if (!window.currentRoomId || !window.onSnapshotFunc) return;
        if (this.roomInGameListenerUnsub) { this.roomInGameListenerUnsub(); this.roomInGameListenerUnsub = null; }

        const roomRef = window.docFunc(window.dbInstance, "rooms", window.currentRoomId);
        this.roomInGameListenerUnsub = window.onSnapshotFunc(roomRef, (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            this.cachedGameStateData = data;
            
            if (data.status === 'playing' && !document.body.classList.contains('in-game')) {
                document.body.classList.add('in-game');
                if (window.loadFragment) window.loadFragment('game');
                return;
            }

            this.synchronizeRoleIdentityUI();
            this.synchronizeForensicCluesBoard();
            this.synchronizeLiveEventsHistoryLog();
        });
    },

    synchronizeRoleIdentityUI: function() {
        if (!this.cachedGameStateData || !window.currentUserData) return;
        const myName = window.currentUserData.username_lower;
        const assignedRole = this.cachedGameStateData.roles ? this.cachedGameStateData.roles[myName] : 'investigator';
        
        const badge = document.getElementById('game-role-identity-badge');
        const desc = document.getElementById('game-role-strategy-description');
        const avatar = document.getElementById('game-role-avatar-picture');

        if (!badge || !desc || !avatar) return;

        const activeCharId = (this.cachedGameStateData.characterSelections || {})[myName];
        if (window.GAME_ASSETS && window.GAME_ASSETS.characters) {
            const charObj = window.GAME_ASSETS.characters.find(c => c.id === activeCharId);
            avatar.src = charObj ? charObj.src : 'assets/images/default-avatar.png';
        }

        if (assignedRole === 'forensic') {
            badge.innerText = 'الطبيب الشرعي'; badge.style.background = '#9b59b6';
            desc.innerText = 'أنت تملك الحقيقة ولكن لا يمكنك الكلام. وجه المحققين عبر لوحة الأدلة.';
        } else if (assignedRole === 'murderer') {
            badge.innerText = 'القاتل السري'; badge.style.background = '#e74c3c';
            desc.innerText = 'أنت الجاني! ضلل المحققين وأبعد الشبهات عن أدواتك الشخصية للفوز.';
        } else {
            badge.innerText = 'المحقق الجنائي'; badge.style.background = '#27ae60';
            desc.innerText = 'عين العدالة. حلل الأدلة وقارن الآثار لتقديم بلاغ اتهام صحيح 100%.';
        }
    },

    buildCourtRoomUI: function() {
        if (!this.cachedGameStateData) return;
        const grid = document.getElementById('game-court-players-injection-grid');
        if (!grid) return;
        
        document.getElementById('game-court-current-round-title').innerText = `الجولة الجنائية رقم ${this.cachedGameStateData.currentRound || 1}`;
        grid.innerHTML = '';

        const playersList = this.cachedGameStateData.players || [];
        const charMap = this.cachedGameStateData.characterSelections || {};
        const myName = window.currentUserData.username_lower;

        playersList.forEach(pName => {
            if (pName === myName) return;
            let profile = window.lobbyPlayersCache[pName] || { username: pName };
            let charObj = window.GAME_ASSETS.characters.find(c => c.id === charMap[pName]);
            let avatarSrc = charObj ? charObj.src : 'assets/images/default-avatar.png';

            grid.innerHTML += `
                <div class="court-player-card">
                    <img src="${avatarSrc}" style="width: 75px; height: 100px; border-radius: 16px; object-fit: cover; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.08);">
                    <div style="font-weight: 700; color: #ffffff; margin-bottom: 15px;">${profile.username}</div>
                    <button class="btn-core" style="padding: 10px 22px; font-size: 0.85rem;" onclick="window.GameEngine.openOfficialAccusationModalForm('${pName}')"><i class="ph-bold ph-gavel"></i> اتهم هذا المشتبه به</button>
                </div>`;
        });
    },

    openOfficialAccusationModalForm: function(targetName) {
        const myName = window.currentUserData.username_lower;
        const usedAccusations = this.cachedGameStateData.accusationsUsed || {};
        
        if (usedAccusations[myName]) {
            if (window.showTempModal) window.showTempModal("بلاغ مرفوض", "استنفدت حق الاتهام لهذه المباراة!", "ph-bold ph-x-circle", "#ff4c6a");
            return;
        }

        const items = this.cachedGameStateData.playerItems[targetName] || { weapons: [], evidence: [] };
        let wHtml = items.weapons.map(w => `<option value="${w}">${w}</option>`).join('');
        let eHtml = items.evidence.map(e => `<option value="${e}">${e}</option>`).join('');

        const modalHtml = `
            <div class="friend-data-card" style="padding: 25px; text-align: center; max-width: 420px; direction: rtl;">
                <h3 style="color: #ffffff; margin-bottom: 12px; font-weight: 800;"><i class="ph-fill ph-gavel" style="color: var(--accent-red); margin-left: 5px;"></i> تقديم بلاغ رسمي</h3>
                <p style="color: var(--text-dim); font-size: 0.82rem; margin-bottom: 20px;">يجب تحديد الأداة والأثر بدقة لتجنب فشل البلاغ.</p>
                <div class="input-wrapper" style="text-align: right;">
                    <label style="color: var(--text-main); font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block;">أداة الجريمة</label>
                    <select id="court-chosen-weapon-select" class="premium-input" style="text-align: right; direction: rtl; background: var(--bg-base); font-family: var(--font-ar); font-weight: bold;">${wHtml}</select>
                </div>
                <div class="input-wrapper" style="text-align: right; margin-top: 15px;">
                    <label style="color: var(--text-main); font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block;">الدليل / الأثر</label>
                    <select id="court-chosen-evidence-select" class="premium-input" style="text-align: right; direction: rtl; background: var(--bg-base); font-family: var(--font-ar); font-weight: bold;">${eHtml}</select>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 25px;">
                    <button class="btn-secondary" style="margin-top: 0; flex: 1; border-radius: 100px;" onclick="document.getElementById('court-accusation-modal').remove()">إلغاء</button>
                    <button class="btn-core" style="flex: 2; border-radius: 100px;" onclick="window.GameEngine.transmitFinalAccusationPayload('${targetName}')">إرسال للمختبر</button>
                </div>
            </div>`;

        const modal = document.createElement('div');
        modal.id = 'court-accusation-modal';
        modal.className = 'friend-data-modal';
        modal.innerHTML = modalHtml;
        document.body.appendChild(modal);
    },

    transmitFinalAccusationPayload: async function(targetName) {
        const weapon = document.getElementById('court-chosen-weapon-select').value;
        const evidence = document.getElementById('court-chosen-evidence-select').value;
        const myName = window.currentUserData.username_lower;
        document.getElementById('court-accusation-modal').remove();

        try {
            const { doc, updateDoc, arrayUnion } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const roomRef = doc(window.dbInstance, "rooms", window.currentRoomId);
            
            let updates = {}; updates[`accusationsUsed.${myName}`] = true;
            updates.actionsHistoryLog = arrayUnion(`قدم [${window.currentUserData.username}] بلاغاً ضد [${targetName}] بأداة (${weapon}) وأثر (${evidence}).`);
            
            await updateDoc(roomRef, updates);
            if (window.showTempModal) window.showTempModal("تم التقديم", "تم إرسال بلاغك الجنائي.", "ph-bold ph-shield-check", "#2ecc71");
        } catch (e) { console.error("Accusation failed:", e); }
    },

    synchronizeForensicCluesBoard: function() {
        const board = document.getElementById('game-forensic-clues-tiles-board');
        if (!board || !this.cachedGameStateData) return;
        board.innerHTML = '';
        (this.cachedGameStateData.cluesBoard || []).forEach(tile => {
            board.innerHTML += `
                <div class="court-player-card" style="text-align: right; padding: 22px; border-right: 4px solid var(--accent-red);">
                    <div style="font-size: 0.8rem; color: var(--text-dim); font-weight: 800; margin-bottom: 6px;">${tile.tileName}</div>
                    <div style="font-size: 1.15rem; font-weight: 900; color: white;">${tile.value}</div>
                </div>`;
        });
    },

    buildToolsAndEvidenceUI: function() {
        const grid = document.getElementById('game-scene-investigation-tools-grid');
        if (!grid || !this.cachedGameStateData) return;
        grid.innerHTML = '';
        
        const players = this.cachedGameStateData.players || [];
        const itemsMap = this.cachedGameStateData.playerItems || {};

        players.forEach(pName => {
            let profile = window.lobbyPlayersCache[pName] || { username: pName };
            let items = itemsMap[pName] || { weapons: [], evidence: [] };
            
            let wHtml = items.weapons.map(w => `<div class="game-square-box weapon-type"><i class="ph-bold ph-knife"></i><span>${w}</span></div>`).join('');
            let eHtml = items.evidence.map(e => `<div class="game-square-box evidence-type"><i class="ph-bold ph-mask-happy"></i><span>${e}</span></div>`).join('');

            grid.innerHTML += `
                <div class="game-premium-card" style="padding-top: 18px;">
                    <div style="font-weight: 900; text-align: right; color: var(--accent-red); font-size: 1.2rem; margin-bottom: 10px;">${profile.username}</div>
                    <div class="items-pool-header-title">أدوات محتملة</div><div class="items-four-squares-grid">${wHtml}</div>
                    <div class="items-pool-header-title" style="margin-top: 15px;">آثار مادية</div><div class="items-four-squares-grid">${eHtml}</div>
                </div>`;
        });
    },

    buildSettingsPlayersUI: function() {
        if (!this.cachedGameStateData) return;
        const myName = window.currentUserData.username_lower;
        
        const mySpace = document.getElementById('game-in-my-personal-emblem');
        if (mySpace && window.UI_COMPONENTS) mySpace.innerHTML = window.UI_COMPONENTS.buildEmblemCard(window.currentUserData, "90px", false);

        const listSpace = document.getElementById('game-in-others-emblems-list');
        if (!listSpace) return;
        listSpace.innerHTML = '';
        
        (this.cachedGameStateData.players || []).forEach(pName => {
            if (pName === myName) return; 
            let pData = window.lobbyPlayersCache[pName] || { username: pName };
            if (window.UI_COMPONENTS) listSpace.innerHTML += window.UI_COMPONENTS.buildEmblemCard(pData, "75px", false);
        });
    },

    synchronizeLiveEventsHistoryLog: function() {
        const logBox = document.getElementById('game-rounds-live-events-log');
        if (!logBox || !this.cachedGameStateData) return;
        logBox.innerHTML = '';
        (this.cachedGameStateData.actionsHistoryLog || []).forEach(log => {
            logBox.innerHTML += `<div class="log-item-row"><i class="ph-bold ph-caret-left" style="color: var(--accent-red); margin-left: 5px;"></i> ${log}</div>`;
        });
    },

    leaveAndCollapseActiveGame: function() {
        if (this.roomInGameListenerUnsub) { this.roomInGameListenerUnsub(); this.roomInGameListenerUnsub = null; }
        document.body.classList.remove('in-game');
        if (window.leaveFirebaseRoom) window.leaveFirebaseRoom();
    }
};

// تفعيل الاسترداد التلقائي بمجرد نجاح تسجيل الدخول
setTimeout(() => {
    if(window.authInstance) {
        window.authInstance.onAuthStateChanged((user) => {
            if(user && !window.isGuest && window.currentUserData) {
                window.GameEngine.recoverGameSession(window.currentUserData.username_lower);
            }
        });
    }
}, 3000);
