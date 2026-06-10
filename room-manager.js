// ==========================================
// محرك إدارة الغرف (Room Engine - Firebase)
// ==========================================

window.currentRoomId = null;
window.roomUnsubscribe = null;
window.currentRoomData = null;

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
        alert("يجب تسجيل الدخول أولاً.");
        return false;
    }
    
    if (!window.setDocFunc || !window.docFunc || !window.dbInstance) {
        alert("خدمات السيرفر غير جاهزة بعد، حاول مجدداً.");
        return false;
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
        return roomCode;
    } catch (error) {
        console.error("Error creating room:", error);
        alert("حدث خطأ في إنشاء غرفة. تأكد من قواعد حماية الفايربيس (Rules).");
        return false;
    }
};

window.joinFirebaseRoom = async function(roomCode) {
    if (!window.authInstance || !window.authInstance.currentUser) return false;
    if (!window.getDocFunc) return false;

    try {
        const roomRef = window.docFunc(window.dbInstance, "rooms", roomCode);
        const roomSnap = await window.getDocFunc(roomRef); 

        if (!roomSnap.exists()) {
            alert("الغرفة غير موجودة أو تم إغلاقها.");
            return false;
        }

        const data = roomSnap.data();
        if (data.status !== 'waiting') {
            alert("اللعبة بدأت بالفعل!");
            return false;
        }
        if (data.players.length >= data.maxPlayers) {
            alert("الغرفة ممتلئة!");
            return false;
        }

        const userName = window.currentUserData.username_lower;
        if (!data.players.includes(userName)) {
            await window.updateDocFunc(roomRef, {
                players: window.arrayUnion(userName)
            });
        }

        window.currentRoomId = roomCode;
        return true;
    } catch (error) {
        console.error("Error joining room:", error);
        alert("حدث خطأ أثناء الانضمام.");
        return false;
    }
};

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
        
        if(window.fetchAndRenderLobbyPlayers) {
            await window.fetchAndRenderLobbyPlayers();
        }
    });
};

window.leaveFirebaseRoom = async function(forced = false) {
    const user = window.authInstance ? window.authInstance.currentUser : null;
    
    if (window.roomUnsubscribe) {
        window.roomUnsubscribe();
        window.roomUnsubscribe = null;
    }

    if (!forced && user && window.currentRoomId && window.currentRoomData) {
        try {
            const roomRef = window.docFunc(window.dbInstance, "rooms", window.currentRoomId);
            
            if (window.currentRoomData.hostId === user.uid) {
                // إذا كان المالك، نستخدم كود الحذف إذا أردنا (أو نتركه مؤقتاً لتنظيف السيرفر يدوياً)
                await window.updateDocFunc(roomRef, { status: 'closed' });
            } else {
                await window.updateDocFunc(roomRef, {
                    players: window.arrayRemove(window.currentUserData.username_lower),
                    readyPlayers: window.arrayRemove(window.currentUserData.username_lower)
                });
            }
        } catch (e) { console.error("Error leaving room:", e); }
    }

    window.currentRoomId = null;
    window.currentRoomData = null;
    
    if (window.loadFragment) {
        window.loadFragment('play', document.querySelectorAll('.nav-btn')[1]);
    }
};
