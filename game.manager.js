// ========================================================================
// DECEPTION - CORE ISOLATED GAME ENGINE LOGIC (100% SECURE & COMPLETE)
// ========================================================================

window.GameEngine = {
    roomInGameListenerUnsub: null,
    cachedGameStateData: null,

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
            let localizedWeapons = [...pureWeaponsPool].sort(() => Math.random() - 0.5).slice(0, 4);
            let localizedEvidence = [...pureEvidencePool].sort(() => Math.random() - 0.5).slice(0, 4);
            
            assignedPlayerItemsDatabase[playerNameKey] = {
                weapons: localizedWeapons,
                evidence: localizedEvidence
            };
        });

        // تم إضافة الاستيراد المباشر والمحمي لمنع فشل الزر بصمت
        try {
            const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const currentRoomDocumentRef = doc(window.dbInstance, "rooms", window.currentRoomId);
            
            await updateDoc(currentRoomDocumentRef, {
                status: 'playing',
                currentRound: 1,
                roles: allocatedRolesMap,
                playerItems: assignedPlayerItemsDatabase,
                accusationsUsed: {},
                cluesBoard: [
                    { tileName: 'مكان الجريمة الرئيسي', value: 'بانتظار اختيار الطبيب الشرعي...' },
                    { tileName: 'سبب الوفاة المباشر', value: 'بانتظار تشريح الجثة...' }
                ],
                actionsHistoryLog: ['تم قفل الغرفة بنجاح وبدأت الجولة الأولى.']
            });
            
            document.body.classList.add('in-game');
            if (window.loadFragment) {
                window.loadFragment('game');
            }
        } catch (firebaseUpdateError) {
            console.error("Game Engine Error:", firebaseUpdateError);
            if (window.showTempModal) {
                window.showTempModal("خطأ تقني", "فشل بدء اللعبة: تأكد من الاتصال بقاعدة البيانات.", "ph-bold ph-warning-circle", "#ff4c6a");
            } else {
                alert("Game Start Error: " + firebaseUpdateError.message);
            }
        }
    },

    activateInGameRealtimeListener: function() {
        if (!window.currentRoomId || !window.onSnapshotFunc) return;
        
        if (this.roomInGameListenerUnsub) {
            this.roomInGameListenerUnsub();
            this.roomInGameListenerUnsub = null;
        }

        const roomQueryReference = window.docFunc(window.dbInstance, "rooms", window.currentRoomId);
        
        this.roomInGameListenerUnsub = window.onSnapshotFunc(roomQueryReference, (realtimeSnapshot) => {
            if (!realtimeSnapshot.exists()) return;
            
            const fetchedData = realtimeSnapshot.data();
            this.cachedGameStateData = fetchedData;
            
            if (fetchedData.status === 'playing' && !document.body.classList.contains('in-game')) {
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
        
        const myNameLowerKey = window.currentUserData.username_lower;
        const assignedRole = this.cachedGameStateData.roles ? this.cachedGameStateData.roles[myNameLowerKey] : 'investigator';
        
        const badgeElement = document.getElementById('game-role-identity-badge');
        const descriptionElement = document.getElementById('game-role-strategy-description');
        const avatarImageElement = document.getElementById('game-role-avatar-picture');

        if (!badgeElement || !descriptionElement || !avatarImageElement) return;

        const currentSelectionsMap = this.cachedGameStateData.characterSelections || {};
        const activeCharId = currentSelectionsMap[myNameLowerKey];
        if (window.GAME_ASSETS && window.GAME_ASSETS.characters) {
            const assetObject = window.GAME_ASSETS.characters.find(item => item.id === activeCharId);
            if (assetObject) {
                avatarImageElement.src = assetObject.src;
            } else {
                avatarImageElement.src = 'assets/images/default-avatar.png';
            }
        }

        if (assignedRole === 'forensic') {
            badgeElement.innerText = 'الطبيب الشرعي';
            badgeElement.style.background = '#9b59b6';
            descriptionElement.innerText = 'أنت الوحيد الذي يمتلك خيوط الجريمة وتعرف هوية القاتل والأدلة المادية! يُحظر عليك التحدث نهائياً، وعليك توجيه المحققين إلى الحل الصحيح بذكاء عن طريق اختيار الكلمات التلميحية المناسبة من لوحة الأدلة.';
        } else if (assignedRole === 'murderer') {
            badgeElement.innerText = 'القاتل السري';
            badgeElement.style.background = '#e74c3c';
            descriptionElement.innerText = 'لقد قمت بارتكاب الجريمة بنجاح! سلاح فوزك الوحيد هو التضليل وإبعاد الشبهات عن أدواتك المادية المحيطة بك وحماية نفسك من اتهامات المحققين الأذكياء. حاول إلصاق التهم بالآخرين أثناء النقاش.';
        } else {
            badgeElement.innerText = 'المحقق الجنائي';
            badgeElement.style.background = '#27ae60';
            descriptionElement.innerText = 'أنت حامي العدالة وعين القانون في مسرح الجريمة. حلل بورد التلميحات الخاص بالطبيب الشرعي بدقة متناهية، قارن الأدوات والآثار الموزعة على المشتبه بهم، وعند تيقنك تماماً وجّه الاتهام الرسمي!';
        }
    },

    buildCourtRoomUI: function() {
        if (!this.cachedGameStateData) return;
        
        const gridContainerElement = document.getElementById('game-court-players-injection-grid');
        if (!gridContainerElement) return;
        
        document.getElementById('game-court-current-round-title').innerText = `الجولة الجنائية رقم ${this.cachedGameStateData.currentRound || 1}`;
        gridContainerElement.innerHTML = '';

        const gamePlayersList = this.cachedGameStateData.players || [];
        const characterSelectionsMap = this.cachedGameStateData.characterSelections || {};
        const myLocalUsernameLower = window.currentUserData.username_lower;

        gamePlayersList.forEach(playerKeyName => {
            if (playerKeyName === myLocalUsernameLower) return;
            
            let accountProfileData = window.lobbyPlayersCache[playerKeyName] || { username: playerKeyName };
            let associatedCharId = characterSelectionsMap[playerKeyName];
            let matchedAsset = window.GAME_ASSETS.characters.find(char => char.id === associatedCharId);
            let verifiedAvatarSource = matchedAsset ? matchedAsset.src : 'assets/images/default-avatar.png';

            gridContainerElement.innerHTML += `
                <div class="court-player-card">
                    <img src="${verifiedAvatarSource}" style="width: 75px; height: 100px; border-radius: 16px; object-fit: cover; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.08);">
                    <div style="font-weight: 700; color: #ffffff; margin-bottom: 15px; font-size: 1.05rem;">${accountProfileData.username}</div>
                    <button class="btn-core" style="padding: 10px 22px; font-size: 0.85rem;" onclick="window.GameEngine.openOfficialAccusationModalForm('${playerKeyName}')">
                        <i class="ph-bold ph-gavel"></i> اتهم هذا المشتبه به
                    </button>
                </div>
            `;
        });
    },

    openOfficialAccusationModalForm: function(accusedTargetPlayerName) {
        const myLocalUsernameLower = window.currentUserData.username_lower;
        const usedAccusationsMap = this.cachedGameStateData.accusationsUsed || {};
        
        if (usedAccusationsMap[myLocalUsernameLower]) {
            if (window.showTempModal) {
                window.showTempModal("بلاغ مرفوض", "لقد استنفدت حق الاتهام والمحاكمة الخاص بك لهذه المباراة مسبقاً ولا يمكنك تقديم بلاغ آخر!", "ph-bold ph-x-circle", "#ff4c6a");
            }
            return;
        }

        const targetAssignedPool = this.cachedGameStateData.playerItems[accusedTargetPlayerName] || { weapons: [], evidence: [] };
        
        let weaponSelectorOptionsHtml = targetAssignedPool.weapons.map(wep => `<option value="${wep}">${wep}</option>`).join('');
        let evidenceSelectorOptionsHtml = targetAssignedPool.evidence.map(evd => `<option value="${evd}">${evd}</option>`).join('');

        const dynamicAccuseModalStructureHtml = `
            <div class="friend-data-card" style="padding: 25px; text-align: center; max-width: 420px; direction: rtl;">
                <h3 style="color: #ffffff; margin-bottom: 12px; font-weight: 800;">
                    <i class="ph-fill ph-gavel" style="color: var(--accent-red); margin-left: 5px;"></i> تقديم بلاغ اتهام جنائي رسمي
                </h3>
                <p style="color: var(--text-dim); font-size: 0.82rem; margin-bottom: 20px; line-height: 1.6;">
                    تنبيه: يجب تحديد أداة الجريمة والأثر المادي بدقة مطلقة، إذا أخطأت في عنصر واحد فقط، سيفشل البلاغ بالكامل ويُقفل صامتاً دون أي توضيح للخطأ!
                </p>
                
                <div class="input-wrapper" style="text-align: right;">
                    <label style="color: var(--text-main); font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block;">أداة الجريمة المحتملة (القتال)</label>
                    <select id="court-chosen-weapon-select" class="premium-input" style="text-align: right; direction: rtl; background: var(--bg-base); font-family: var(--font-ar); font-weight: bold;">
                        ${weaponSelectorOptionsHtml}
                    </select>
                </div>
                
                <div class="input-wrapper" style="text-align: right; margin-top: 15px;">
                    <label style="color: var(--text-main); font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; display: block;">الدليل أو الأثر الشخصي المرتبط</label>
                    <select id="court-chosen-evidence-select" class="premium-input" style="text-align: right; direction: rtl; background: var(--bg-base); font-family: var(--font-ar); font-weight: bold;">
                        ${evidenceSelectorOptionsHtml}
                    </select>
                </div>

                <div style="display: flex; gap: 12px; margin-top: 25px;">
                    <button class="btn-secondary" style="margin-top: 0; flex: 1; border-radius: 100px;" onclick="document.getElementById('court-accusation-form-modal-overlay').remove()">إلغاء</button>
                    <button class="btn-core" style="flex: 2; border-radius: 100px;" onclick="window.GameEngine.transmitFinalAccusationPayload('${accusedTargetPlayerName}')">إرسال للمختبر الجنائي</button>
                </div>
            </div>
        `;

        const outerModalDivElement = document.createElement('div');
        outerModalDivElement.id = 'court-accusation-form-modal-overlay';
        outerModalDivElement.className = 'friend-data-modal';
        outerModalDivElement.innerHTML = dynamicAccuseModalStructureHtml;
        document.body.appendChild(outerModalDivElement);
    },

    transmitFinalAccusationPayload: async function(targetedPlayerKeyName) {
        const weaponSelectedValue = document.getElementById('court-chosen-weapon-select').value;
        const evidenceSelectedValue = document.getElementById('court-chosen-evidence-select').value;
        const myLocalUsernameLower = window.currentUserData.username_lower;

        document.getElementById('court-accusation-form-modal-overlay').remove();

        try {
            const { doc, updateDoc, arrayUnion } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const roomRef = doc(window.dbInstance, "rooms", window.currentRoomId);
            
            let atomicUpdateData = {};
            atomicUpdateData[`accusationsUsed.${myLocalUsernameLower}`] = true;
            
            const logMessageString = `قام المحقق [${window.currentUserData.username}] بتقديم بلاغ رسمي ضد [${targetedPlayerKeyName}] متهماً إياه باستخدام (${weaponSelectedValue}) وترك أثر (${evidenceSelectedValue}).`;
            
            await updateDoc(roomRef, {
                ...atomicUpdateData,
                actionsHistoryLog: arrayUnion(logMessageString)
            });

            if (window.showTempModal) {
                window.showTempModal("تم تقديم البلاغ", "استقبل المختبر الجنائي بلاغك الرسمي، تفقد لوحة سجل الجولات لمعرفة النتائج لاحقاً.", "ph-bold ph-shield-check", "#2ecc71");
            }
        } catch (accusationSubmissionError) {
            console.error("Failed to push accusation payload:", accusationSubmissionError);
        }
    },

    synchronizeForensicCluesBoard: function() {
        const boardContainerElement = document.getElementById('game-forensic-clues-tiles-board');
        if (!boardContainerElement || !this.cachedGameStateData) return;
        
        const cluesTilesArray = this.cachedGameStateData.cluesBoard || [];
        boardContainerElement.innerHTML = '';

        cluesTilesArray.forEach(tileItem => {
            boardContainerElement.innerHTML += `
                <div class="court-player-card" style="text-align: right; padding: 22px; border-right: 4px solid var(--accent-red);">
                    <div style="font-size: 0.8rem; color: var(--text-dim); font-weight: 800; text-transform: uppercase; margin-bottom: 6px;">${tileItem.tileName}</div>
                    <div style="font-size: 1.15rem; font-weight: 900; color: #ffffff; font-family: var(--font-ar);">${tileItem.value}</div>
                </div>
            `;
        });
    },

    buildToolsAndEvidenceUI: function() {
        if (!this.cachedGameStateData) return;
        
        const mainInvestigationToolsGrid = document.getElementById('game-scene-investigation-tools-grid');
        if (!mainInvestigationToolsGrid) return;

        mainInvestigationToolsGrid.innerHTML = '';
        
        const totalRoomPlayersList = this.cachedGameStateData.players || [];
        const entirePlayerItemsMap = this.cachedGameStateData.playerItems || {};

        totalRoomPlayersList.forEach(playerNameKey => {
            let userProfileCache = window.lobbyPlayersCache[playerNameKey] || { username: playerNameKey };
            let userItemsObject = entirePlayerItemsMap[playerNameKey] || { weapons: [], evidence: [] };

            let formattedWeaponsSquaresHtml = userItemsObject.weapons.map(weaponName => `
                <div class="game-square-box weapon-type">
                    <i class="ph-bold ph-knife"></i>
                    <span>${weaponName}</span>
                </div>
            `).join('');

            let formattedEvidenceSquaresHtml = userItemsObject.evidence.map(evidenceName => `
                <div class="game-square-box evidence-type">
                    <i class="ph-bold ph-mask-happy"></i>
                    <span>${evidenceName}</span>
                </div>
            `).join('');

            mainInvestigationToolsGrid.innerHTML += `
                <div class="game-premium-card" style="padding-top: 18px; display: flex; flex-direction: column; gap: 4px;">
                    <div style="font-weight: 900; text-align: right; color: var(--accent-red); font-size: 1.2rem; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 5px;">
                        ${userProfileCache.username}
                    </div>
                    <div class="items-pool-header-title">أدوات الجريمة المحتملة (الأزرار الحمراء)</div>
                    <div class="items-four-squares-grid">${formattedWeaponsSquaresHtml}</div>
                    
                    <div class="items-pool-header-title" style="margin-top: 15px;">الآثار والقرائن المادية (الأزرار الزرقاء)</div>
                    <div class="items-four-squares-grid">${formattedEvidenceSquaresHtml}</div>
                </div>
            `;
        });
    },

    buildSettingsPlayersUI: function() {
        if (!this.cachedGameStateData) return;
        
        const currentActiveMyNameLower = window.currentUserData.username_lower;
        
        const myPersonalSpace = document.getElementById('game-in-my-personal-emblem');
        if (myPersonalSpace && window.UI_COMPONENTS && typeof window.UI_COMPONENTS.buildEmblemCard === 'function') {
            myPersonalSpace.innerHTML = window.UI_COMPONENTS.buildEmblemCard(window.currentUserData, "90px", false);
        }

        const othersContainerListSpace = document.getElementById('game-in-others-emblems-list');
        if (!othersContainerListSpace) return;
        
        othersContainerListSpace.innerHTML = '';
        const currentRoomPlayersList = this.cachedGameStateData.players || [];
        
        currentRoomPlayersList.forEach(loopPlayerNameKey => {
            if (loopPlayerNameKey === currentActiveMyNameLower) return; 
            
            let opponentAccountData = window.lobbyPlayersCache[loopPlayerNameKey] || { username: loopPlayerNameKey };
            if (window.UI_COMPONENTS && typeof window.UI_COMPONENTS.buildEmblemCard === 'function') {
                othersContainerListSpace.innerHTML += window.UI_COMPONENTS.buildEmblemCard(opponentAccountData, "75px", false);
            }
        });
    },

    synchronizeLiveEventsHistoryLog: function() {
        const logBoxContainerElement = document.getElementById('game-rounds-live-events-log');
        if (!logBoxContainerElement || !this.cachedGameStateData) return;
        
        const dynamicHistoryArray = this.cachedGameStateData.actionsHistoryLog || [];
        logBoxContainerElement.innerHTML = '';

        dynamicHistoryArray.forEach(logLineString => {
            logBoxContainerElement.innerHTML += `
                <div class="log-item-row">
                    <i class="ph-bold ph-caret-left" style="color: var(--accent-red); margin-left: 5px; font-size: 0.7rem;"></i> ${logLineString}
                </div>
            `;
        });
    },

    leaveAndCollapseActiveGame: function() {
        if (this.roomInGameListenerUnsub) {
            this.roomInGameListenerUnsub();
            this.roomInGameListenerUnsub = null;
        }

        document.body.classList.remove('in-game');
        
        if (window.leaveFirebaseRoom) {
            window.leaveFirebaseRoom();
        }
    }
};
