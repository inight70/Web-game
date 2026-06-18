// ==========================================
// محرك اللعبة (Game Engine) - نسخة البوتات الشاملة (المصححة)
// ==========================================

window.gameEngine = {
    // 1. بنك الكلمات لتوليد الأسلحة والآثار
    weaponsPool: ['سكين', 'مسدس', 'سم', 'حبل', 'مطرقة', 'مقص', 'فأس', 'قناص', 'سيف', 'حقنة', 'وسادة', 'حجر', 'منشار', 'بندقية', 'قوس', 'خنجر'],
    evidencePool: ['نظارة', 'قلم', 'ساعة', 'مفتاح', 'خاتم', 'منديل', 'محفظة', 'عطر', 'ولاعة', 'قفاز', 'زر قميص', 'تذكرة', 'عقد', 'شعر', 'بصمة', 'حذاء'],

    getRandomItems: function(pool, count) {
        let shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    },

    // 2. دالة المراقبة (الرادار) - هذه التي كانت مفقودة وتمنع الانتقال للعبة!
    watchGameState: function() {
        if(!window.currentRoomData) return;
        const currentPath = sessionStorage.getItem('saved_branch_play');
        
        // الانتقال لصفحة اللعبة إذا تحولت الحالة إلى playing
        if(window.currentRoomData.status === 'playing' && currentPath !== 'game') {
            console.log("⚡ Game Started! Routing to Game Board...");
            if(window.loadFragment) window.loadFragment('game', null);
        }
        
        // العودة للوبي إذا انتهت اللعبة
        if(window.currentRoomData.status === 'waiting' && currentPath === 'game') {
            document.body.classList.remove('in-game-mode');
            if(window.loadFragment) window.loadFragment('lobby', null);
        }
    },

    // 3. دالة بدء اللعبة وتوزيع الأدوار (مع دعم البوتات)
    startGameWithBots: async function() {
        if(!window.currentRoomId || !window.authInstance || !window.authInstance.currentUser) return;
        
        if(window.currentRoomData.hostId !== window.authInstance.currentUser.uid) {
            if(window.showTempModal) window.showTempModal("مرفوض", "المالك فقط يمكنه بدء اللعب.", "ph-bold ph-lock", "#ff4c6a");
            return;
        }

        const startBtn = document.getElementById('btn-start-action');
        if(startBtn) { startBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin" style="font-size:1.3rem;"></i> <span>جاري التجهيز...</span>'; startBtn.disabled = true; }

        try {
            let realPlayers = window.currentRoomData.players || [];
            let allPlayers = [...realPlayers];
            
            // إضافة البوتات ليكتمل العدد إلى 6 لاعبين (إذا لم تضفهم أنت يدوياً)
            const botNames = ['Bot_Alpha', 'Bot_Bravo', 'Bot_Charlie', 'Bot_Delta', 'Bot_Echo'];
            let botsNeeded = 6 - realPlayers.length;
            for(let i=0; i < botsNeeded; i++) {
                if (!allPlayers.includes(botNames[i])) {
                    allPlayers.push(botNames[i]);
                }
            }

            // خلط اللاعبين لتوزيع الأدوار بسرية
            let shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);

            // توزيع الأدوار (طبيب، قاتل، شريك، شاهد، ومحققين)
            let assignedRoles = {};
            assignedRoles[shuffledPlayers[0]] = 'forensic';
            assignedRoles[shuffledPlayers[1]] = 'murderer';
            assignedRoles[shuffledPlayers[2]] = 'accomplice';
            assignedRoles[shuffledPlayers[3]] = 'witness';
            for (let i = 4; i < shuffledPlayers.length; i++) {
                assignedRoles[shuffledPlayers[i]] = 'investigator';
            }

            // توليد الأسلحة والأدلة لجميع اللاعبين (بمن فيهم البوتات)
            let playersItems = {};
            allPlayers.forEach(pName => {
                playersItems[pName] = {
                    weapons: window.gameEngine.getRandomItems(window.gameEngine.weaponsPool, 4),
                    evidence: window.gameEngine.getRandomItems(window.gameEngine.evidencePool, 4)
                };
            });

            // تحديث قاعدة البيانات (هنا نعطي الإشارة للرادار بالانتقال)
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
            if(startBtn) { startBtn.innerHTML = '<i class="ph-fill ph-play" style="font-size:1.3rem;"></i> <span>بدء اللعبة</span>'; startBtn.disabled = false; }
        }
    },

    // 4. دالة المغادرة وإيقاف الرادار
    requestLeaveGame: function() {
        if(confirm("هل أنت متأكد أنك تريد مغادرة اللعبة؟")) {
            document.body.classList.remove('in-game-mode');
            if(window._gameWatcher) { clearInterval(window._gameWatcher); window._gameWatcher = null; }
            if(window.leaveFirebaseRoom) window.leaveFirebaseRoom();
            else window.loadFragment('home'); 
        }
    }
};

// ==========================================
// 5. ربط محرك اللعبة بنظام الغرف (تشغيل الرادار)
// ==========================================
const originalRoomListener = window.listenToRoom;
window.listenToRoom = function() {
    // تشغيل نظام الاستماع الأصلي
    if(originalRoomListener) originalRoomListener();
    
    // تشغيل الرادار كل ثانية للبحث عن تغيير الحالة إلى "playing"
    if(window._gameWatcher) clearInterval(window._gameWatcher);
    window._gameWatcher = setInterval(() => {
        if(window.gameEngine) window.gameEngine.watchGameState();
    }, 1000);
};

// دالة بدء احتياطية (تستخدم من أزرار HTML)
window.executeStartGame = function() {
    if(window.gameEngine) window.gameEngine.startGameWithBots();
};
