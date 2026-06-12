// ==========================================
// محرك إدارة الغرف (Room Engine - Firebase)
// ==========================================

window.currentRoomId = null;
window.roomUnsubscribe = null;
window.currentRoomData = null;

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

        await window.updateDocFunc(window.docFunc(window.dbInstance, "users", user.uid), { activeRoom: roomCode });

        window.currentRoomId = roomCode;
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
        const user = window.authInstance.currentUser;

        if (!data.players.includes(userName)) {
            await window.updateDocFunc(roomRef, {
                players: window.arrayUnion(userName)
            });
        }
        
        await window.updateDocFunc(window.docFunc(window.dbInstance, "users", user.uid), { activeRoom: roomCode });

        window.currentRoomId = roomCode;
        
        if(window.loadFragment) { window.loadFragment('lobby', document.querySelectorAll('.nav-btn')[1]); }
        return true;
    } catch (error) {
        console.error("Error joining room:", error);
        return false;
    }
};

// ===========================================
// نافذة التحكم باللاعبين (طرد / عرض بروفايل)
// ===========================================
window.openPlayerRoomOptions = function(playerName) {
    if (!window.currentRoomData || !window.authInstance || !window.authInstance.currentUser) return;
    const isHost = window.currentRoomData.hostId === window.authInstance.currentUser.uid;
    const myName = window.currentUserData.username_lower;
    
    // لا يمكنك طرد نفسك أو فتح قائمتك من هنا
    if (playerName.toLowerCase() === myName) return; 

    const pData = window.lobbyPlayersCache[playerName.toLowerCase()] || window.friendsCache[playerName.toLowerCase()] || { username: playerName };
    const emblemHTML = window.UI_COMPONENTS && window.UI_COMPONENTS.buildEmblemCard ? window.UI_COMPONENTS.buildEmblemCard(pData, "100px", true) : `<div style="color:white; font-size: 1.5rem; text-align:center;">${playerName}</div>`;

    let actionButtons = `<button onclick="window.viewFriendProfile('${playerName}'); document.getElementById('room-player-modal').remove();" class="modern-action-btn"><i class="ph-bold ph-user-circle"></i> عرض الملف الشخصي</button>`;
    
    if (isHost) {
        actionButtons += `<button onclick="window.kickPlayer('${playerName}'); document.getElementById('room-player-modal').remove();" class="modern-danger-btn" style="margin-top:10px;"><i class="ph-bold ph-user-minus"></i> طرد من الغرفة</button>`;
    }

    const modalHtml = `
        <div class="friend-data-card" style="padding: 0; width: 95%; max-width: 380px; position: relative; border-radius: 24px; overflow:hidden;">
            <button onclick="document.getElementById('room-player-modal').remove()" style="position: absolute; top: 15px; right: 15px; z-index: 100; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; backdrop-filter: blur(8px); transition: 0.2s;"><i class="ph-bold ph-x"></i></button>
            ${emblemHTML}
            <div style="padding: 20px; display: flex; flex-direction: column; background: linear-gradient(180deg, var(--surface-panel) 0%, var(--bg-base) 100%);">
                ${actionButtons}
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.id = 'room-player-modal';
    modal.className = 'friend-data-modal';
    modal.style.zIndex = '10000000';
    modal.onclick = function(e) { if(e.target === modal) modal.remove(); };
    modal.innerHTML = modalHtml;
    document.body.appendChild(modal);
};

window.kickPlayer = async function(playerName) {
    if (!window.currentRoomId || !window.currentRoomData) return;
    try {
        const roomRef = window.docFunc(window.dbInstance, "rooms", window.currentRoomId);
        await window.updateDocFunc(roomRef, {
            players: window.arrayRemove(playerName.toLowerCase()),
            readyPlayers: window.arrayRemove(playerName.toLowerCase())
        });
    } catch(e) { console.error("Error kicking player", e); }
};

function syncLobbyPlayers(playersArray) {
    let changed = false;
    Object.keys(window.lobbyPlayerListeners).forEach(pName => {
        if (!playersArray.includes(pName)) {
            window.lobbyPlayerListeners[pName](); 
            delete window.lobbyPlayerListeners[pName];
            delete window.lobbyPlayersCache[pName];
            changed = true; // لاعب غادر! سيتم تحديث اللوبي فوراً
        }
    });

    playersArray.forEach(pName => {
        if (!window.lobbyPlayerListeners[pName]) {
            const q = window.queryFunc(window.collectionFunc(window.dbInstance, "users"), window.whereFunc("username_lower", "==", pName));
            window.lobbyPlayerListeners[pName] = window.onSnapshotFunc(q, (snap) => {
                if (!snap.empty) {
                    window.lobbyPlayersCache[pName] = snap.docs[0].data();
                }
                if (window.fetchAndRenderLobbyPlayers) window.fetchAndRenderLobbyPlayers();
            });
            changed = true;
        }
    });
    
    // المزامنة اللحظية
    if (changed && window.fetchAndRenderLobbyPlayers) {
        window.fetchAndRenderLobbyPlayers();
    }
}

window.listenToRoom = function() {
    if (!window.currentRoomId || !window.onSnapshotFunc) return;

    const roomRef = window.docFunc(window.dbInstance, "rooms", window.currentRoomId);
    
    window.roomUnsubscribe = window.onSnapshotFunc(roomRef, async (snap) => {
        if (!snap.exists()) {
            if(window.showRoomClosedModal) window.showRoomClosedModal();
            window.leaveFirebaseRoom(true); 
            return;
        }
        window.currentRoomData = snap.data();
        
        // التحقق اللحظي: هل تم طردي من الغرفة؟
        const myName = window.currentUserData.username_lower;
        if (window.currentRoomData && window.currentRoomData.players && !window.currentRoomData.players.includes(myName)) {
            alert("لقد قام مالك الغرفة بطردك.");
            window.leaveFirebaseRoom(true);
            return;
        }

        syncLobbyPlayers(window.currentRoomData.players || []);
    });
};

window.leaveFirebaseRoom = async function(forced = false) {
    const user = window.authInstance ? window.authInstance.currentUser : null;
    
    if (window.roomUnsubscribe) { window.roomUnsubscribe(); window.roomUnsubscribe = null; }

    Object.values(window.lobbyPlayerListeners).forEach(unsub => { if(typeof unsub === 'function') unsub(); });
    window.lobbyPlayerListeners = {};
    window.lobbyPlayersCache = {};

    if (user) {
        try {
            await window.updateDocFunc(window.docFunc(window.dbInstance, "users", user.uid), { activeRoom: null });

            if (!forced && window.currentRoomId && window.currentRoomData) {
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
            }
        } catch (e) { console.error("Error leaving room:", e); }
    }

    window.currentRoomId = null;
    window.currentRoomData = null;
    
    if (window.loadFragment) {
        window.loadFragment('play', document.querySelectorAll('.nav-btn')[1]);
    }
};
