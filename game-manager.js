// ==========================================
// محرك اللعبة (Game Engine) - النسخة المنيعة والسريعة
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
            if(window.cleanupGameUI) window.cleanupGameUI(); // تنظيف الأزرار فوراً
            if(window.leaveFirebaseRoom) window.leaveFirebaseRoom();
            else window.loadFragment('home'); 
        }
    }
};

// ==========================================
// الرادار النبضي السريع (يستشعر بدء الغرفة بلمح البصر وبدون ثقل)
// ==========================================
const originalRoomListener = window.listenToRoom;
window.listenToRoom = function() {
    if(originalRoomListener) originalRoomListener();
    
    if(window._masterGameRadar) clearInterval(window._masterGameRadar);
    
    // النبضة كل 300 جزء من الثانية (سريعة جداً ولا تستهلك الذاكرة إطلاقاً)
    window._masterGameRadar = setInterval(() => {
        if(!window.currentRoomData) return;
        const currentPath = sessionStorage.getItem('saved_branch_play');
        
        // عند بدء اللعبة
        if(window.currentRoomData.status === 'playing' && currentPath !== 'game') {
            if(window.initGameUI) window.initGameUI(); // تركيب الواجهة
            if(window.loadFragment) window.loadFragment('game', null);
        }
        
        // عند العودة للوبي
        if(window.currentRoomData.status === 'waiting' && currentPath === 'game') {
            if(window.cleanupGameUI) window.cleanupGameUI(); // تنظيف الواجهة والعودة لانديكس
            if(window.loadFragment) window.loadFragment('lobby', null);
        }
    }, 300);
};

window.executeStartGame = function() {
    if(window.gameEngine) window.gameEngine.startGameWithBots();
};
