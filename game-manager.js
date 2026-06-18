// ==========================================
// محرك اللعبة (Game Engine) - النسخة المحسنة
// ==========================================

window.gameEngine = {
    // 1. بنك الكلمات لتوليد الأسلحة والآثار (سيتم قراءتها لاحقاً في اللعبة)
    weaponsPool: ['سكين', 'مسدس', 'سم', 'حبل', 'مطرقة', 'مقص', 'فأس', 'قناص', 'سيف', 'حقنة', 'وسادة', 'حجر', 'منشار', 'بندقية', 'قوس', 'خنجر'],
    evidencePool: ['نظارة', 'قلم', 'ساعة', 'مفتاح', 'خاتم', 'منديل', 'محفظة', 'عطر', 'ولاعة', 'قفاز', 'زر قميص', 'تذكرة', 'عقد', 'شعر', 'بصمة', 'حذاء'],

    // دالة مساعدة لسحب أدوات عشوائية من البنك
    getRandomItems: function(pool, count) {
        let shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    },

    // 2. المراقبة اللحظية للعبة (بدون تعليق المتصفح)
    watchGameState: function() {
        if(!window.currentRoomData) return;
        const currentPath = sessionStorage.getItem('saved_branch_play');
        
        // الانتقال للعبة إذا بدأت
        if(window.currentRoomData.status === 'playing' && currentPath !== 'game') {
            console.log("⚡ Game Started! Routing to Game Board...");
            if(window.loadFragment) window.loadFragment('game', null);
        }
        
        // إذا قام المالك بإنهاء اللعبة وأعاد الغرفة لوضع الانتظار، نرجع للوبي
        if(window.currentRoomData.status === 'waiting' && currentPath === 'game') {
            document.body.classList.remove('in-game-mode');
            if(window.loadFragment) window.loadFragment('lobby', null);
        }
    },

    // 3. دالة بدء اللعبة من المالك
    startGameAsHost: async function() {
        if(!window.currentRoomId || !window.authInstance || !window.authInstance.currentUser) return;
        
        if(window.currentRoomData.hostId !== window.authInstance.currentUser.uid) {
            if(window.showTempModal) window.showTempModal("مرفوض", "مالك الغرفة فقط يمكنه بدء اللعب.", "ph-bold ph-lock", "#ff4c6a");
            return;
        }

        const players = window.currentRoomData.players || [];
        
        // شرط اللاعبين 2 لغرض التجربة حالياً
        if(players.length < 2) {
            if(window.showTempModal) window.showTempModal("عدد غير كافٍ", "يجب أن يكون هناك لاعبان (2) على الأقل للبدء.", "ph-bold ph-users", "#f1c40f");
            return; 
        }

        const startBtn = document.getElementById('btn-start-action');
        if(startBtn) { startBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> <span>جاري التجهيز...</span>'; startBtn.disabled = true; }

        try {
            // أ) خلط اللاعبين لتوزيع الأدوار
            let shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

            // ب) تحديد الأدوار
            let assignedRoles = {};
            assignedRoles[shuffledPlayers[0]] = 'forensic'; // اللاعب الأول: طبيب شرعي
            assignedRoles[shuffledPlayers[1]] = 'murderer'; // اللاعب الثاني: قاتل
            
            let startIndex = 2;
            if (players.length >= 6) {
                assignedRoles[shuffledPlayers[2]] = 'accomplice';
                assignedRoles[shuffledPlayers[3]] = 'witness';
                startIndex = 4;
            }
            for (let i = startIndex; i < shuffledPlayers.length; i++) {
                assignedRoles[shuffledPlayers[i]] = 'investigator';
            }

            // ج) توليد الأدوات لكل لاعب متواجد في الغرفة
            let playersItems = {};
            players.forEach(pName => {
                playersItems[pName] = {
                    weapons: window.gameEngine.getRandomItems(window.gameEngine.weaponsPool, 4), // 4 أسلحة
                    evidence: window.gameEngine.getRandomItems(window.gameEngine.evidencePool, 4) // 4 آثار
                };
            });

            // د) رفع الداتا بالكامل إلى Firebase
            const roomRef = window.docFunc(window.dbInstance, "rooms", window.currentRoomId);
            await window.updateDocFunc(roomRef, {
                status: 'playing',
                roles: assignedRoles,
                items: playersItems, // الأسلحة والأدلة أصبحت محفوظة في السيرفر!
                currentRound: 1,
                startedAt: new Date().toISOString()
            });
            
        } catch (error) {
            console.error("Error starting game:", error);
            if(startBtn) { startBtn.innerHTML = '<i class="ph-bold ph-play"></i> <span>بدء اللعبة</span>'; startBtn.disabled = false; }
            if(window.showTempModal) window.showTempModal("خطأ", "حدث خطأ أثناء بدء اللعبة.", "ph-bold ph-warning-circle", "#ff4c6a");
        }
    },

    // 4. دالة المغادرة وتنظيف الذاكرة
    requestLeaveGame: function() {
        if(confirm("هل أنت متأكد أنك تريد مغادرة اللعبة؟ سيؤدي ذلك للانسحاب من الغرفة.")) {
            // تنظيف واجهة اللعبة
            document.body.classList.remove('in-game-mode');
            
            // إيقاف المحرك لمنع استهلاك الذاكرة وتعليق اللوبي
            if(window._gameWatcher) clearInterval(window._gameWatcher);
            window._gameWatcher = null;
            
            // استدعاء المغادرة
            if(window.leaveFirebaseRoom) {
                window.leaveFirebaseRoom();
            } else {
                window.loadFragment('home'); 
            }
        }
    }
};

// ==========================================
// ربط المحرك بنظام الغرف (Hook)
// ==========================================
const originalRoomListener = window.listenToRoom;
window.listenToRoom = function() {
    if(originalRoomListener) originalRoomListener();
    
    // تشغيل المراقب كل ثانية مع التأكد من إيقاف القديم
    if(window._gameWatcher) clearInterval(window._gameWatcher);
    window._gameWatcher = setInterval(() => {
        if(window.gameEngine) window.gameEngine.watchGameState();
    }, 1000);
};
