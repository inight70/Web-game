// ==========================================
// محرك اللعبة (Game Engine)
// ==========================================

window.gameEngine = {
    // مراقبة حالة الغرفة للانتقال الجماعي
    watchGameState: function() {
        if(!window.currentRoomData) return;

        const currentPath = sessionStorage.getItem('saved_branch_play');
        // إذا تغيرت الحالة إلى playing ولم نكن في صفحة اللعبة بالفعل، ننتقل فوراً
        if(window.currentRoomData.status === 'playing' && currentPath !== 'game') {
            console.log("⚡ Game Started! Routing to Game Board...");
            if(window.loadFragment) window.loadFragment('game', null);
        }
    },

    // بدء اللعبة وتوزيع الأدوار (يضغط عليه المالك فقط)
    startGameAsHost: async function() {
        if(!window.currentRoomId || !window.authInstance || !window.authInstance.currentUser) return;
        
        // حماية: التأكد أن من ضغط الزر هو المالك فعلاً
        if(window.currentRoomData.hostId !== window.authInstance.currentUser.uid) {
            if(window.showTempModal) window.showTempModal("مرفوض", "مالك الغرفة فقط يمكنه بدء اللعب.", "ph-bold ph-lock", "#ff4c6a");
            return;
        }

        const players = window.currentRoomData.players || [];
        
        // حماية الحد الأدنى للاعبين
        if(players.length < 4) {
            if(window.showTempModal) window.showTempModal("عدد غير كافٍ", "يجب أن يكون هناك 4 لاعبين على الأقل لبدء اللعبة.", "ph-bold ph-users", "#f1c40f");
            // ملاحظة: يمكنك إزالة علامتي // من السطر التالي لتفعيل الحماية، حالياً معطلة لتسهيل تجربتك وحدك
            // return; 
        }

        // تغيير شكل الزر لمنع الضغط المزدوج
        const startBtn = document.getElementById('btn-start-action');
        if(startBtn) { startBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> <span>جاري التجهيز...</span>'; startBtn.disabled = true; }

        try {
            // === 1. خلط اللاعبين عشوائياً ===
            let shuffledPlayers = [...players];
            for (let i = shuffledPlayers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
            }

            // === 2. توزيع الأدوار ===
            let assignedRoles = {};
            
            // معالجة خاصة في حال كنت تجرب اللعبة وحدك لتجنب الأخطاء البرمجية
            if (shuffledPlayers.length === 1) {
                assignedRoles[shuffledPlayers[0]] = 'forensic';
            } else {
                assignedRoles[shuffledPlayers[0]] = 'forensic'; // الأول دائماً الطبيب الشرعي
                assignedRoles[shuffledPlayers[1]] = 'murderer'; // الثاني دائماً القاتل
                
                let startIndex = 2;
                // إذا كان العدد 6 فما فوق، نضيف الشريك والشاهد
                if (players.length >= 6) {
                    assignedRoles[shuffledPlayers[2]] = 'accomplice';
                    assignedRoles[shuffledPlayers[3]] = 'witness';
                    startIndex = 4;
                }

                // البقية محققون
                for (let i = startIndex; i < shuffledPlayers.length; i++) {
                    assignedRoles[shuffledPlayers[i]] = 'investigator';
                }
            }

            // === 3. تحديث الغرفة في Firebase وبدء اللعبة ===
            const roomRef = window.docFunc(window.dbInstance, "rooms", window.currentRoomId);
            await window.updateDocFunc(roomRef, {
                status: 'playing',     // هذه الكلمة ستنقل الجميع فوراً للعبة
                roles: assignedRoles,  // حفظ الأدوار السرية
                currentRound: 1,       // جولة اللعب الأولى
                startedAt: new Date().toISOString()
            });
            
        } catch (error) {
            console.error("Error starting game:", error);
            if(startBtn) { startBtn.innerHTML = '<i class="ph-bold ph-play"></i> <span>بدء اللعبة</span>'; startBtn.disabled = false; }
            if(window.showTempModal) window.showTempModal("خطأ", "حدث خطأ أثناء بدء اللعبة.", "ph-bold ph-warning-circle", "#ff4c6a");
        }
    },

    // طلب مغادرة اللعبة (من شاشة الإعدادات داخل اللعبة)
    requestLeaveGame: function() {
        if(confirm("هل أنت متأكد أنك تريد مغادرة اللعبة الجارية؟ ستخسر تقدمك في هذه الجولة.")) {
            // إزالة كلاس الإخفاء لتعود قوائم الموقع الجانبية والسفلية
            document.body.classList.remove('in-game-mode');
            
            if(window.leaveFirebaseRoom) {
                window.leaveFirebaseRoom();
            } else {
                window.loadFragment('home'); 
            }
        }
    }
};

// ==========================================
// ربط المحرك بنظام المراقبة (Hook)
// ==========================================
// نعدل على دالة الاستماع للغرفة لنجعلها تراقب حالة بدء اللعبة أيضاً
const originalRoomListener = window.listenToRoom;
window.listenToRoom = function() {
    if(originalRoomListener) originalRoomListener();
    
    if(window._gameWatcher) clearInterval(window._gameWatcher);
    window._gameWatcher = setInterval(() => {
        if(window.gameEngine) window.gameEngine.watchGameState();
    }, 1000);
};
