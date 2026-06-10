// ==========================================
// محرك إدارة الغرف (Room Engine - Firebase)
// ==========================================

window.currentRoomId = null;
window.roomUnsubscribe = null;
window.currentRoomData = null;

// 1. توليد كود حقيقي للغرفة (4 أحرف وأرقام عشوائية)
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // تمت إزالة الحروف المتشابهة مثل O و 0
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// 2. إنشاء غرفة جديدة
window.createFirebaseRoom = async function() {
    const user = window.authInstance.currentUser;
    if (!user || !window.currentUserData) return false;

    try {
        window.hideLoader(); // تأكد من إظهار علامة تحميل لديك إذا لزم الأمر
        const roomCode = generateRoomCode();
        
        // بناء هيكل الغرفة في الفايربيس
        const roomRef = window.docFunc(window.dbInstance, "rooms", roomCode);
        await window.setDocFunc(roomRef, {
            id: roomCode,
            hostId: user.uid,
            hostName: window.currentUserData.username,
            players: [window.currentUserData.username_lower], // نحفظ الأسماء (lower) لتسهيل جلب البيانات
            maxPlayers: 6,
            status: 'waiting',
            createdAt: new Date().toISOString(),
            settings: { mode: 'classic', timeLimit: 60 } // إعدادات قابلة للتوسيع لاحقاً
        });

        window.currentRoomId = roomCode;
        return roomCode;
    } catch (error) {
        console.error("Error creating room:", error);
        alert("حدث خطأ أثناء إنشاء الغرفة.");
        return false;
    }
};

// 3. الانضمام لغرفة موجودة
window.joinFirebaseRoom = async function(roomCode) {
    const user = window.authInstance.currentUser;
    if (!user || !window.currentUserData) return false;

    try {
        const roomRef = window.docFunc(window.dbInstance, "rooms", roomCode);
        const roomSnap = await window.getDocFunc(roomRef); // تحتاج استدعاء getDoc في firebase-config

        if (!roomSnap.exists()) {
            alert("الغرفة غير موجودة! تأكد من الكود.");
            return false;
        }

        const data = roomSnap.data();
        if (data.status !== 'waiting') {
            alert("اللعبة بدأت بالفعل في هذه الغرفة!");
            return false;
        }
        if (data.players.length >= data.maxPlayers) {
            alert("الغرفة ممتلئة!");
            return false;
        }

        // إضافة اللاعب للغرفة
        await window.updateDocFunc(roomRef, {
            players: window.arrayUnion(window.currentUserData.username_lower)
        });

        window.currentRoomId = roomCode;
        return true;
    } catch (error) {
        console.error("Error joining room:", error);
        alert("حدث خطأ أثناء محاولة الانضمام.");
        return false;
    }
};

// 4. الاستماع اللحظي لتحديثات الغرفة (Real-time Listener)
window.listenToRoom = function() {
    if (!window.currentRoomId) return;

    const roomRef = window.docFunc(window.dbInstance, "rooms", window.currentRoomId);
    
    window.roomUnsubscribe = window.onSnapshotFunc(roomRef, async (snap) => {
        if (!snap.exists()) {
            // الغرفة حُذفت (المالك غادر)
            alert("تم إغلاق الغرفة من قبل المالك.");
            window.leaveFirebaseRoom(true); // true = forced
            return;
        }

        window.currentRoomData = snap.data();
        
        // جلب بيانات جميع اللاعبين المتواجدين في الغرفة لرسم أمبلماتهم
        await window.fetchAndRenderLobbyPlayers();
    });
};

// 5. مغادرة الغرفة
window.leaveFirebaseRoom = async function(forced = false) {
    const user = window.authInstance.currentUser;
    if (window.roomUnsubscribe) {
        window.roomUnsubscribe();
        window.roomUnsubscribe = null;
    }

    if (!forced && user && window.currentRoomId && window.currentRoomData) {
        try {
            const roomRef = window.docFunc(window.dbInstance, "rooms", window.currentRoomId);
            
            // إذا كان المغادر هو المالك، احذف الغرفة (أو يمكنك نقل الملكية لاحقاً)
            if (window.currentRoomData.hostId === user.uid) {
                const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                await deleteDoc(roomRef);
            } else {
                // إذا كان لاعباً عادياً، احذفه من القائمة
                await window.updateDocFunc(roomRef, {
                    players: window.arrayRemove(window.currentUserData.username_lower)
                });
            }
        } catch (e) { console.error("Error leaving room:", e); }
    }

    window.currentRoomId = null;
    window.currentRoomData = null;
    
    // العودة للصفحة الرئيسية
    if (window.loadFragment) {
        window.loadFragment('play', document.querySelectorAll('.nav-btn')[1]);
    }
};
