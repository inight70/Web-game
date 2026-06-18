// ==========================================
// محرك اللعبة (Game Engine) - الإصدار النهائي الخالي من الأخطاء
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
            window.gameUIController.disable(); // تنظيف الأزرار بأمان تام
            if(window._masterGameRadar) { clearInterval(window._masterGameRadar); window._masterGameRadar = null; }
            if(window.leaveFirebaseRoom) window.leaveFirebaseRoom();
            else window.loadFragment('home'); 
        }
    }
};

// ==========================================
// محرك التحكم بالواجهات (الحل الجذري لمشكلة الـ Cache)
// ==========================================
window.gameUIController = {
    injectButtons: function() {
        this.disable(); // تنظيف استباقي لمنع التكرار
        
        const btnHTML = `
            <button class="nav-btn game-injected-btn active" onclick="window.switchGameTab('tab-game-settings', 0)"><i class="ph-fill ph-gear"></i></button>
            <button class="nav-btn game-injected-btn" onclick="window.switchGameTab('tab-game-info', 1)"><i class="ph ph-identification-card"></i></button>
            <button class="nav-btn game-injected-btn" onclick="window.switchGameTab('tab-game-accuse', 2)"><i class="ph ph-gavel"></i></button>
            <button class="nav-btn game-injected-btn" onclick="window.switchGameTab('tab-game-evidence', 3)"><i class="ph ph-microscope"></i></button>
            <button class="nav-btn game-injected-btn" onclick="window.switchGameTab('tab-game-items', 4)"><i class="ph ph-briefcase"></i></button>
        `;
        
        // حقن الكمبيوتر
        const desktopMenu = document.querySelector('.sidebar .nav-menu');
        if(desktopMenu) desktopMenu.insertAdjacentHTML('beforeend', btnHTML);

        // حقن الجوال (مع تغيير الكلاسات لتناسب الشريط السفلي)
        const mobileHTML = btnHTML.replace(/nav-btn/g, 'bottom-tab');
        const mobileMenu = document.querySelector('.bottom-bar');
        if(mobileMenu) mobileMenu.insertAdjacentHTML('beforeend', mobileHTML);
    },
    enable: function() {
        document.body.classList.add('in-game-mode');
        this.injectButtons();
    },
    disable: function() {
        document.body.classList.remove('in-game-mode');
        document.querySelectorAll('.game-injected-btn').forEach(b => b.remove());
    }
};

window.switchGameTab = function(tabId, index) {
    document.querySelectorAll('.g-section-view').forEach(s => s.classList.remove('active'));
    const targetSec = document.getElementById(tabId);
    if(targetSec) targetSec.classList.add('active');

    const syncBtns = (selector) => {
        document.querySelectorAll(selector).forEach((b, i) => {
            b.classList.toggle('active', i === index);
            const icon = b.querySelector('i');
            if(icon) {
                if(i === index) { icon.classList.remove('ph'); icon.classList.add('ph-fill'); }
                else { icon.classList.remove('ph-fill'); icon.classList.add('ph'); }
            }
        });
    };
    syncBtns('.sidebar .game-injected-btn');
    syncBtns('.bottom-bar .game-injected-btn');
};

// ==========================================
// الرادار العالمي (يستشعر بدء الغرفة ويفعل الواجهات فوراً)
// ==========================================
const originalRoomListener = window.listenToRoom;
window.listenToRoom = function() {
    if(originalRoomListener) originalRoomListener();
    
    if(window._masterGameRadar) clearInterval(window._masterGameRadar);
    window._masterGameRadar = setInterval(() => {
        if(!window.currentRoomData) return;
        
        const currentPath = sessionStorage.getItem('saved_branch_play');
        
        if(window.currentRoomData.status === 'playing' && currentPath !== 'game') {
            window.gameUIController.enable(); // تحويل شريط الموقع إلى شريط لعبة
            if(window.loadFragment) window.loadFragment('game', null);
        }
        
        if(window.currentRoomData.status === 'waiting' && currentPath === 'game') {
            window.gameUIController.disable(); // إرجاع أزرار الموقع الطبيعية
            if(window.loadFragment) window.loadFragment('lobby', null);
        }
    }, 1000);
};

window.executeStartGame = function() {
    if(window.gameEngine) window.gameEngine.startGameWithBots();
};
