// ==========================================
// محرك اللعبة (Game Engine) - نظيف 100% وبدون حقن
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
            if(window.leaveFirebaseRoom) window.leaveFirebaseRoom();
            else window.loadFragment('home'); 
        }
    }
};

// ==========================================
// الرادار المنيع للدخول والخروج من اللعبة
// ==========================================
const originalRoomListener = window.listenToRoom;
window.listenToRoom = function() {
    if(originalRoomListener) originalRoomListener();
    
    if(window._masterGameRadar) clearInterval(window._masterGameRadar);
    window._masterGameRadar = setInterval(() => {
        if(!window.currentRoomData) return;
        const currentPath = sessionStorage.getItem('saved_branch_play');
        
        if(window.currentRoomData.status === 'playing' && currentPath !== 'game') {
            if(window.loadFragment) window.loadFragment('game', null);
        }
        
        if(window.currentRoomData.status === 'waiting' && currentPath === 'game') {
            if(window.loadFragment) window.loadFragment('lobby', null);
        }
    }, 1000);
};

window.executeStartGame = function() {
    if(window.gameEngine) window.gameEngine.startGameWithBots();
};
