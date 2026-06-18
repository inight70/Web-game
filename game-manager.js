// ==========================================
// محرك اللعبة (Game Engine) - نسخة البوتات والتجربة
// ==========================================

window.gameEngine = {
    // 1. بنك الكلمات لتوليد الأسلحة والآثار
    weaponsPool: ['سكين', 'مسدس', 'سم', 'حبل', 'مطرقة', 'مقص', 'فأس', 'قناص', 'سيف', 'حقنة', 'وسادة', 'حجر', 'منشار', 'بندقية', 'قوس', 'خنجر'],
    evidencePool: ['نظارة', 'قلم', 'ساعة', 'مفتاح', 'خاتم', 'منديل', 'محفظة', 'عطر', 'ولاعة', 'قفاز', 'زر قميص', 'تذكرة', 'عقد', 'شعر', 'بصمة', 'حذاء'],

    getRandomItems: function(pool, count) {
        let shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    },

    // 2. دالة بدء اللعبة مع إضافة البوتات (للتجربة)
    startGameWithBots: async function() {
        if(!window.currentRoomId || !window.authInstance || !window.authInstance.currentUser) return;
        
        if(window.currentRoomData.hostId !== window.authInstance.currentUser.uid) {
            if(window.showTempModal) window.showTempModal("مرفوض", "المالك فقط يمكنه بدء اللعب.", "ph-bold ph-lock", "#ff4c6a");
            return;
        }

        const startBtn = document.getElementById('btn-start-action');
        if(startBtn) { startBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i>'; startBtn.disabled = true; }

        try {
            let realPlayers = window.currentRoomData.players || [];
            let allPlayers = [...realPlayers];
            
            // إضافة البوتات ليكتمل العدد إلى 6 لاعبين
            const botNames = ['Bot_Alpha', 'Bot_Bravo', 'Bot_Charlie', 'Bot_Delta', 'Bot_Echo'];
            let botsNeeded = 6 - realPlayers.length;
            for(let i=0; i < botsNeeded; i++) {
                allPlayers.push(botNames[i]);
            }

            // خلط اللاعبين (الحقيقيين + البوتات)
            let shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);

            // توزيع الأدوار لـ 6 لاعبين (حسب قواعد Deception)
            let assignedRoles = {};
            assignedRoles[shuffledPlayers[0]] = 'forensic';   // طبيب شرعي
            assignedRoles[shuffledPlayers[1]] = 'murderer';   // قاتل
            assignedRoles[shuffledPlayers[2]] = 'accomplice'; // شريك
            assignedRoles[shuffledPlayers[3]] = 'witness';    // شاهد
            assignedRoles[shuffledPlayers[4]] = 'investigator'; // محقق
            assignedRoles[shuffledPlayers[5]] = 'investigator'; // محقق

            // توليد 4 أسلحة و 4 أدلة لكل لاعب (حتى البوتات)
            let playersItems = {};
            allPlayers.forEach(pName => {
                playersItems[pName] = {
                    weapons: window.gameEngine.getRandomItems(window.gameEngine.weaponsPool, 4),
                    evidence: window.gameEngine.getRandomItems(window.gameEngine.evidencePool, 4)
                };
            });

            // تحديث قاعدة البيانات
            const roomRef = window.docFunc(window.dbInstance, "rooms", window.currentRoomId);
            await window.updateDocFunc(roomRef, {
                status: 'playing',
                players: allPlayers, // تحديث قائمة اللاعبين لتشمل البوتات
                roles: assignedRoles,
                items: playersItems,
                currentRound: 1,
                startedAt: new Date().toISOString()
            });
            
        } catch (error) {
            console.error("Error starting game:", error);
            if(startBtn) { startBtn.innerHTML = '<i class="ph-bold ph-play"></i> بدء اللعبة'; startBtn.disabled = false; }
        }
    },

    // 3. الخروج من اللعبة وتفريغ الذاكرة
    requestLeaveGame: function() {
        if(confirm("هل أنت متأكد أنك تريد مغادرة اللعبة؟")) {
            document.body.classList.remove('in-game-mode');
            if(window.leaveFirebaseRoom) window.leaveFirebaseRoom();
            else window.loadFragment('home'); 
        }
    }
};

// ربط المحرك بزر البدء في اللوبي مباشرة (تعديل سريع)
window.executeStartGame = function() {
    if(window.gameEngine) window.gameEngine.startGameWithBots();
};
