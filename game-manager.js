// ==========================================
// محرك اللعبة (Game Engine) - نسخة الانتقال السينمائي
// ==========================================

window.gameEngine = {
    weaponsPool: ['سكين', 'مسدس', 'سم', 'حبل', 'مطرقة', 'مقص', 'فأس', 'قناص', 'سيف', 'حقنة', 'وسادة', 'حجر', 'منشار', 'بندقية', 'قوس', 'خنجر'],
    evidencePool: ['نظارة', 'قلم', 'ساعة', 'مفتاح', 'خاتم', 'منديل', 'محفظة', 'عطر', 'ولاعة', 'قفاز', 'زر قميص', 'تذكرة', 'عقد', 'شعر', 'بصمة', 'حذاء'],

    getRandomItems: function(pool, count) {
        let shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    },

    startGameWithBots: async function() {
        if(!window.currentRoomId || !window.authInstance.currentUser) return;
        const startBtn = document.getElementById('btn-start-action');
        if(startBtn) { startBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i>'; startBtn.disabled = true; }

        try {
            let allPlayers = [...window.currentRoomData.players];
            const botNames = ['Bot_Alpha', 'Bot_Bravo', 'Bot_Charlie', 'Bot_Delta', 'Bot_Echo'];
            let botsNeeded = 6 - allPlayers.length;
            for(let i=0; i < botsNeeded; i++) {
                if (!allPlayers.includes(botNames[i])) allPlayers.push(botNames[i]);
            }

            let shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);
            let assignedRoles = {};
            assignedRoles[shuffledPlayers[0]] = 'forensic';
            assignedRoles[shuffledPlayers[1]] = 'murderer';
            assignedRoles[shuffledPlayers[2]] = 'accomplice';
            assignedRoles[shuffledPlayers[3]] = 'witness';
            for (let i = 4; i < shuffledPlayers.length; i++) {
                assignedRoles[shuffledPlayers[i]] = 'investigator';
            }

            let playersItems = {};
            allPlayers.forEach(pName => {
                playersItems[pName] = {
                    weapons: window.gameEngine.getRandomItems(window.gameEngine.weaponsPool, 4),
                    evidence: window.gameEngine.getRandomItems(window.gameEngine.evidencePool, 4)
                };
            });

            const roomRef = window.docFunc(window.dbInstance, "rooms", window.currentRoomId);
            await window.updateDocFunc(roomRef, {
                status: 'playing',
                players: allPlayers,
                roles: assignedRoles,
                items: playersItems,
                currentRound: 1,
                startedAt: new Date().toISOString()
            });
            
        } catch (error) {
            console.error("Error starting game:", error);
            if(startBtn) { startBtn.innerHTML = '<i class="ph-fill ph-play"></i> بدء اللعبة'; startBtn.disabled = false; }
        }
    },

    requestLeaveGame: function() {
        if(confirm("هل أنت متأكد أنك تريد مغادرة اللعبة؟")) {
            if(window.cleanupGameUI) window.cleanupGameUI();
            if(window.leaveFirebaseRoom) window.leaveFirebaseRoom();
            else window.loadFragment('home'); 
        }
    }
};

// ==========================================
// المشهد السينمائي لبدء اللعبة
// ==========================================
window.showCinematicTransition = function(callback) {
    const overlay = document.createElement('div');
    overlay.id = 'cinematic-intro';
    overlay.style.cssText = `
        position: fixed; inset: 0; background: #0a0a0c; z-index: 9999999;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        opacity: 0; transition: opacity 0.8s ease; text-align: center; padding: 20px;
    `;
    overlay.innerHTML = `
        <style>
            @keyframes cinematicPulse { 0% { filter: drop-shadow(0 0 10px rgba(242, 39, 123, 0.2)); transform: scale(1); } 50% { filter: drop-shadow(0 0 40px rgba(242, 39, 123, 0.8)); transform: scale(1.1); } 100% { filter: drop-shadow(0 0 10px rgba(242, 39, 123, 0.2)); transform: scale(1); } }
            @keyframes cinematicText { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        </style>
        <i class="ph-duotone ph-mask-happy" style="font-size: 7rem; color: var(--accent-red); margin-bottom: 30px; animation: cinematicPulse 2.5s infinite ease-in-out;"></i>
        <h1 style="color: white; font-size: 2.5rem; font-weight: 900; font-family: var(--font-ar); margin-bottom: 15px; animation: cinematicText 1s ease forwards;">الليل يُخيّم على المدينة...</h1>
        <p style="color: var(--text-dim); font-size: 1.1rem; font-family: var(--font-ar); animation: cinematicText 1s ease 0.5s forwards; opacity: 0;">يتم الآن توزيع الأدوار السرية وتجهيز مسرح الجريمة</p>
    `;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    // بعد 3.5 ثانية يختفي المشهد وتظهر اللعبة
    setTimeout(() => {
        overlay.style.opacity = '0';
        callback();
        setTimeout(() => overlay.remove(), 800);
    }, 3500);
};

// ==========================================
// الرادار السريع مع الانتقال السينمائي
// ==========================================
const originalRoomListener = window.listenToRoom;
window.listenToRoom = function() {
    if(originalRoomListener) originalRoomListener();
    
    if(window._masterGameRadar) clearInterval(window._masterGameRadar);
    
    window._masterGameRadar = setInterval(() => {
        if(!window.currentRoomData) return;
        const currentPath = sessionStorage.getItem('saved_branch_play');
        
        if(window.currentRoomData.status === 'playing' && currentPath !== 'game') {
            if(!window.isCinematicPlaying) {
                window.isCinematicPlaying = true;
                
                // تشغيل المشهد السينمائي أولاً، ثم تركيب اللعبة!
                window.showCinematicTransition(() => {
                    if(window.initGameUI) window.initGameUI();
                    if(window.loadFragment) window.loadFragment('game', null);
                    
                    setTimeout(() => { window.isCinematicPlaying = false; }, 500);
                });
            }
        }
        
        if(window.currentRoomData.status === 'waiting' && currentPath === 'game') {
            if(window.cleanupGameUI) window.cleanupGameUI();
            if(window.loadFragment) window.loadFragment('lobby', null);
        }
    }, 300);
};

window.executeStartGame = function() {
    if(window.gameEngine) window.gameEngine.startGameWithBots();
};
