// ==========================================
// محرك اللعبة (Game Engine)
// ==========================================

window.gameEngine = {
    // هذه الدالة ستراقب حالة الغرفة باستمرار
    watchGameState: function() {
        if(!window.currentRoomData) return;

        // إذا تغيرت حالة الغرفة في قاعدة البيانات إلى "playing" ولم نكن نحن في صفحة اللعب، ننقل اللاعب!
        const currentPath = sessionStorage.getItem('saved_branch_play');
        if(window.currentRoomData.status === 'playing' && currentPath !== 'game') {
            console.log("⚡ Game Started! Routing to Game Board...");
            // تغيير مسار اللعب إلى شاشة اللعبة بدلا من اللوبي
            window.loadFragment('game', null);
        }
    },

    // الدالة التي سيضغط عليها مالك الغرفة في شاشة اللوبي لبدء اللعبة
    startGameAsHost: async function() {
        if(!window.currentRoomId || !window.authInstance || !window.authInstance.currentUser) return;
        
        // حماية: التأكد أن من ضغط الزر هو المالك فعلاً
        if(window.currentRoomData.hostId !== window.authInstance.currentUser.uid) {
            if(window.showTempModal) window.showTempModal("مرفوض", "مالك الغرفة فقط يمكنه بدء اللعب.", "ph-bold ph-lock", "#ff4c6a");
            return;
        }

        // حماية: التأكد من وجود الحد الأدنى من اللاعبين (عادة 4 على الأقل)
        const players = window.currentRoomData.players || [];
        if(players.length < 4) {
            if(window.showTempModal) window.showTempModal("عدد غير كافٍ", "يجب أن يكون هناك 4 لاعبين على الأقل لبدء اللعبة.", "ph-bold ph-users", "#f1c40f");
            // للبرمجة التجريبية يمكنك إيقاف هذا السطر بوضع // قبله إذا أردت التجربة وحدك
            // return; 
        }

        try {
            // 1. تحديث حالة الغرفة في Firebase ليعلم الجميع أن اللعبة بدأت
            const roomRef = window.docFunc(window.dbInstance, "rooms", window.currentRoomId);
            await window.updateDocFunc(roomRef, {
                status: 'playing',
                startedAt: new Date().toISOString()
                // لاحقاً سنضيف هنا دالة توزيع الأدوار (القاتل، الطبيب، المحققين)
            });
            
        } catch (error) {
            console.error("Error starting game:", error);
        }
    },

    // دالة الخروج من اللعبة (الموجودة في تبويب الإعدادات)
    requestLeaveGame: function() {
        if(confirm("هل أنت متأكد أنك تريد مغادرة اللعبة الجارية؟ ستخسر تقدمك في هذه الجولة.")) {
            // إزالة كلاس الإخفاء لتعود القوائم
            document.body.classList.remove('in-game-mode');
            
            // استدعاء دالة الخروج الموجودة أصلاً في room-manager.js
            if(window.leaveFirebaseRoom) {
                window.leaveFirebaseRoom();
            } else {
                // للعودة للرئيسية إذا حدث خطأ
                window.loadFragment('home'); 
            }
        }
    }
};

// ==========================================
// ربط المحرك بنظام المراقبة (Hook)
// ==========================================
// بما أن room-manager.js يستمع لتحديثات الغرفة، سنقوم بتعديل بسيط هنا لنخبر المحرك أن يقرأ الحالة الجديدة
const originalRoomListener = window.listenToRoom;
window.listenToRoom = function() {
    // نشغل الدالة الأصلية
    if(originalRoomListener) originalRoomListener();
    
    // ثم ننشئ مراقب دوري (Observer) يراقب المتغير window.currentRoomData
    if(window._gameWatcher) clearInterval(window._gameWatcher);
    window._gameWatcher = setInterval(() => {
        window.gameEngine.watchGameState();
    }, 1000);
};
