// ==========================================
// محرك إدارة الغرف (Room Engine - Firebase)
// ==========================================

window.currentRoomId = sessionStorage.getItem('activeRoomId') || null;
window.roomUnsubscribe = null;
window.currentRoomData = null;

// كاش خاص باللاعبين المتواجدين في اللوبي لتحديث بياناتهم لحظياً
window.lobbyPlayersCache = {};
window.lobbyPlayerListeners = {};

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

window.createFirebaseRoom = async function() {
    if (!window.authInstance || !window.authInstance.currentUser) {
        alert("يجب تسجيل الدخول أولاً."); return false;
    }
    try {
        const user = window.authInstance.currentUser;
        const roomCode = generateRoomCode();
        const userName = window.currentUserData.username_lower;
        
        const roomRef = window.docFunc(window.dbInstance, "rooms", roomCode);
        await window.setDocFunc(roomRef, {
            id: roomCode,
            hostId: user.uid,
            hostName: window.currentUserData.username,
            players: [userName],
            readyPlayers: [],
            maxPlayers: 6,
            status: 'waiting',
            createdAt: new Date().toISOString()
        });

        window.currentRoomId = roomCode;
        sessionStorage.setItem('activeRoomId', roomCode); // حفظ الجلسة
        return roomCode;
    } catch (error) {
        console.error("Error creating room:", error);
        return false;
    }
};

window.joinFirebaseRoom = async function(roomCode) {
    if (!window.authInstance || !window.authInstance.currentUser) return false;

    try {
        const roomRef = window.docFunc(window.dbInstance, "rooms", roomCode);
        const roomSnap = await window.getDocFunc(roomRef); 

        if (!roomSnap.exists()) {
            alert("الغرفة غير موجودة أو تم إغلاقها."); return false;
        }

        const data = roomSnap.data();
        if (data.status !== 'waiting') { alert("اللعبة بدأت بالفعل!"); return false; }
        if (data.players.length >= data.maxPlayers && !data.players.includes(window.currentUserData.username_lower)) {
            alert("الغرفة ممتلئة!"); return false;
        }

        const userName = window.currentUserData.username_lower;
        if (!data.players.includes(userName)) {
            await window.updateDocFunc(roomRef, {
                players: window.arrayUnion(userName)
            });
        }

        window.currentRoomId = roomCode;
        sessionStorage.setItem('activeRoomId', roomCode); // حفظ الجلسة
        
        // إذا كان ينضم من إشعار دعوة وهو في صفحة أخرى
        if(window.loadFragment) { window.loadFragment('lobby', document.querySelectorAll('.nav-btn')[1]); }
        return true;
    } catch (error) {
        console.error("Error joining room:", error);
        return false;
    }
};

// مراقبة اللاعبين داخل الغرفة لحظياً (Real-time Profile Sync)
function syncLobbyPlayers(playersArray) {
    // تنظيف المراقبين للاعبين الذين غادروا
    Object.keys(window.lobbyPlayerListeners).forEach(pName => {
        if (!playersArray.includes(pName)) {
            window.lobbyPlayerListeners[pName]();
            delete window.lobbyPlayerListeners[pName];
            delete window.lobbyPlayersCache[pName];
        }
    });

    // إضافة مراقبين للاعبين الجدد وتحديث البروفايلات لحظياً
    playersArray.forEach(pName => {
        if (!window.lobbyPlayerListeners[pName]) {
            const q = window.queryFunc(window.collectionFunc(window.dbInstance, "users"), window.whereFunc("username_lower", "==", pName));
            window.lobbyPlayerListeners[pName] = window.onSnapshotFunc(q, (snap) => {
                if (!snap.empty) {
                    window.lobbyPlayersCache[pName] = snap.docs[0].data();
                }
                // إعادة رسم اللوبي فوراً بدون طلب بيانات جديدة (لأنها مكيشة)
                if (window.fetchAndRenderLobbyPlayers) window.fetchAndRenderLobbyPlayers();
            });
        }
    });
}

window.listenToRoom = function() {
    if (!window.currentRoomId || !window.onSnapshotFunc) return;

    const roomRef = window.docFunc(window.dbInstance, "rooms", window.currentRoomId);
    
    window.roomUnsubscribe = window.onSnapshotFunc(roomRef, async (snap) => {
        if (!snap.exists()) {
            alert("تم إغلاق الغرفة.");
            window.leaveFirebaseRoom(true); 
            return;
        }

        window.currentRoomData = snap.data();
        
        // تفعيل المزامنة اللحظية للاعبين
        syncLobbyPlayers(window.currentRoomData.players || []);
    });
};

window.leaveFirebaseRoom = async function(forced = false) {
    const user = window.authInstance ? window.authInstance.currentUser : null;
    
    if (window.roomUnsubscribe) { window.roomUnsubscribe(); window.roomUnsubscribe = null; }

    // إيقاف مراقبة بيانات اللاعبين لتوفير موارد الجهاز
    Object.values(window.lobbyPlayerListeners).forEach(unsub => unsubscribe());
    window.lobbyPlayerListeners = {};
    window.lobbyPlayersCache = {};

    if (!forced && user && window.currentRoomId && window.currentRoomData) {
        try {
            const roomRef = window.docFunc(window.dbInstance, "rooms", window.currentRoomId);
            if (window.currentRoomData.hostId === user.uid) {
                const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                await deleteDoc(roomRef);
            } else {
                await window.updateDocFunc(roomRef, {
                    players: window.arrayRemove(window.currentUserData.username_lower),
                    readyPlayers: window.arrayRemove(window.currentUserData.username_lower)
                });
            }
        } catch (e) { console.error(e); }
    }

    window.currentRoomId = null;
    window.currentRoomData = null;
    sessionStorage.removeItem('activeRoomId'); // مسح الجلسة
    
    if (window.loadFragment) {
        window.loadFragment('play', document.querySelectorAll('.nav-btn')[1]);
    }
};
