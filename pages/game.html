<style>
    /* =========================================================================
       1. الإخفاء الذكي: نخفي قوائم الموقع دون تدمير حاوية الموقع
       ========================================================================= */
    body.in-game-mode .right-sidebar, 
    body.in-game-mode .top-header { display: none !important; }
    
    @media (min-width: 901px) {
        body.in-game-mode .sidebar .nav-menu > button:not(.game-injected-btn) { display: none !important; }
    }
    
    body.in-game-mode .app-shell > .bottom-bar { display: none !important; }
    
    body.in-game-mode .dynamic-content { 
        padding: 0 !important; overflow: hidden !important; 
        height: 100vh !important; height: 100dvh !important;
    }

    /* =========================================================================
       2. الشاشة السينمائية المحسنة (Pure Black Dark Intro)
       ========================================================================= */
    .cinematic-intro {
        position: absolute; inset: 0; z-index: 1000000;
        background: #0b0b10; /* خلفية داكنة صافية تماماً بدون إضاءات خلفية */
        display: flex; justify-content: center; align-items: center;
        animation: cinematicFadeOut 0.4s 3.6s forwards ease-out;
    }
    
    .cinematic-logo-wrap {
        position: relative;
        width: 140px; height: 140px;
        display: flex; justify-content: center; align-items: center;
    }

    /* الشعار الأساسي مع أنيميشن الدخول الخفيف والتجهيز للقليتش المدمر */
    .cinematic-logo-wrap img {
        width: 100%; height: 100%; object-fit: contain;
        opacity: 0;
        animation: 
            logoEntrance 0.5s 0.3s forwards ease-out,
            superGlitchEffect 1.2s 2.3s infinite linear; /* يبدأ القليتش المعقد بعد ثانيتين ونصف */
    }

    /* =========================================================================
       🔥 تأثير القليتش الفاخر والمعقد (Advanced Chromatic & Clip Glitch)
       ========================================================================= */
    @keyframes logoEntrance {
        0% { opacity: 0; transform: scale(0.9) translateY(10px); filter: blur(5px); }
        100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
    }

    @keyframes superGlitchEffect {
        0% { clip-path: inset(0 0 0 0); transform: translate(0) skew(0deg); filter: hue-rotate(0deg); }
        7% { clip-path: inset(30% 0 50% 0); transform: translate(-8px, 4px) skew(5deg); filter: hue-rotate(90deg) contrast(1.5); }
        10% { clip-path: inset(15% 0 80% 0); transform: translate(6px, -6px) skew(-10deg); filter: hue-rotate(180deg) saturate(2); }
        13% { clip-path: inset(0 0 0 0); transform: translate(0) skew(0deg); filter: none; }
        45% { clip-path: inset(70% 0 10% 0); transform: translate(-4px, -2px) skew(3deg); filter: invert(0.1); }
        48% { clip-path: inset(40% 0 40% 0); transform: translate(8px, 8px) skew(-5deg); transform: scaleY(1.2); }
        50% { clip-path: inset(0 0 0 0); transform: translate(0) skew(0deg); filter: none; }
        88% { clip-path: inset(85% 0 2% 0); transform: translate(-10px, 0px) skew(15deg); filter: hue-rotate(270deg); }
        90% { clip-path: inset(5% 0 90% 0); transform: translate(10px, -4px) skew(-15deg); }
        93% { clip-path: inset(0 0 0 0); transform: translate(0) skew(0deg); filter: none; }
        97% { transform: scale(1.1) rotate(1deg); opacity: 0.8; }
        100% { clip-path: inset(0 0 0 0); transform: translate(0) skew(0deg); }
    }

    @keyframes cinematicFadeOut {
        0% { opacity: 1; pointer-events: auto; }
        100% { opacity: 0; pointer-events: none; visibility: hidden; }
    }

    /* =========================================================================
       3. حاوية أقسام اللعبة المعزولة كلياً 
       ========================================================================= */
    .g-master-container { position: relative; width: 100%; height: 100%; background: transparent; }

    .g-section-view {
        position: absolute; inset: 0; padding: 40px; padding-bottom: 40px;
        opacity: 0; visibility: hidden; transition: 0.2s ease-in-out;
        overflow-y: auto; scrollbar-width: none;
    }
    .g-section-view::-webkit-scrollbar { display: none; }
    .g-section-view.active { opacity: 1; visibility: visible; z-index: 10; }

    /* تصميم البطاقات الداخلي (مطابق لموقعك) */
    .g-native-card { 
        background: var(--surface-panel); border: 1px solid rgba(255,255,255,0.03); 
        border-radius: 24px; padding: 25px; margin-bottom: 20px; 
        box-shadow: var(--shadow-soft); transition: var(--trans-smooth); 
    }
    .g-native-card:hover { border-color: rgba(242, 39, 123, 0.15); box-shadow: var(--shadow-glow); }
    
    .g-page-title { color: var(--text-main); font-size: 1.8rem; margin-bottom: 25px; font-weight: 900; display: flex; align-items: center; gap: 12px; }
    .g-page-title i { color: var(--accent-red); font-size: 2.2rem; }
    
    .g-badge { 
        background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); 
        border-radius: 14px; padding: 10px 14px; font-size: 0.9rem; 
        color: var(--text-main); font-weight: 700; display: inline-flex; align-items: center; gap: 6px; 
    }

    .game-mobile-bar { display: none !important; }

    @media (max-width: 900px) {
        .g-section-view { padding: 20px 15px 120px 15px; }
        .g-page-title { font-size: 1.5rem; }
        .game-mobile-bar { display: flex !important; z-index: 99999; }
        .cinematic-logo-wrap { width: 100px; height: 100px; }
    }
</style>

<div class="g-master-container" id="game-master-root">
    
    <div class="cinematic-intro" id="cinematic-overlay">
        <div class="cinematic-logo-wrap">
            <img src="assets/images/logo.png" alt="Deception Logo">
        </div>
    </div>

    <div id="tab-game-settings" class="g-section-view">
        <div style="max-width: 600px; margin: 0 auto;">
            <h2 class="game-page-title"><i class="ph-fill ph-gear"></i> الإعدادات</h2>
            <div class="g-native-card">
                <button class="modern-danger-btn" style="width: 100%; padding: 18px; font-size: 1.1rem;" onclick="window.gameEngine.requestLeaveGame()">
                    <i class="ph-bold ph-sign-out"></i> الخروج من اللعبة الحالية
                </button>
            </div>
        </div>
    </div>

    <div id="tab-game-info" class="g-section-view">
        <div style="max-width: 800px; margin: 0 auto;">
            <h2 class="game-page-title"><i class="ph-fill ph-identification-card"></i> هويتي السرية</h2>
            <div id="render-game-role" class="g-native-card" style="text-align: center; padding: 60px 20px;">
                <i class="ph-duotone ph-spinner ph-spin" style="font-size:3rem; color:var(--text-dim);"></i>
            </div>
        </div>
    </div>

    <div id="tab-game-accuse" class="g-section-view active">
        <div style="max-width: 1200px; margin: 0 auto;">
            <h2 class="game-page-title"><i class="ph-fill ph-gavel"></i> منصة الاتهام</h2>
            <div id="render-game-accuse" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">
                <div class="g-native-card" style="text-align:center; grid-column: 1/-1;"><i class="ph-duotone ph-spinner ph-spin" style="font-size:3rem; color:var(--text-dim);"></i></div>
            </div>
        </div>
    </div>

    <div id="tab-game-evidence" class="g-section-view">
        <div style="max-width: 800px; margin: 0 auto;">
            <h2 class="game-page-title"><i class="ph-fill ph-microscope"></i> مسرح الجريمة</h2>
            <div class="g-native-card" style="text-align:center; padding: 80px 20px;">
                <i class="ph-duotone ph-file-magnifying-glass" style="font-size:4rem; color:var(--text-dim); margin-bottom:15px; opacity:0.5;"></i>
                <h3 style="color:var(--text-main); margin-bottom:10px;">لا توجد أدلة بعد</h3>
                <p style="color:var(--text-dim);">تلميحات الطبيب الشرعي ستظهر هنا.</p>
            </div>
        </div>
    </div>

    <div id="tab-game-items" class="g-section-view">
        <div style="max-width: 800px; margin: 0 auto;">
            <h2 class="game-page-title"><i class="ph-fill ph-briefcase"></i> أسلحتي وآثاري</h2>
            <div id="render-game-items" class="g-native-card" style="text-align: center; padding: 60px 20px;">
                <i class="ph-duotone ph-spinner ph-spin" style="font-size:3rem; color:var(--text-dim);"></i>
            </div>
        </div>
    </div>

    <nav class="bottom-bar game-mobile-bar">
        <button class="bottom-tab" onclick="window.switchGameTab('tab-game-settings', 0)"><i class="ph ph-gear"></i></button>
        <button class="bottom-tab" onclick="window.switchGameTab('tab-game-info', 1)"><i class="ph ph-identification-card"></i></button>
        <button class="bottom-tab active" onclick="window.switchGameTab('tab-game-accuse', 2)"><i class="ph-fill ph-gavel"></i></button>
        <button class="bottom-tab" onclick="window.switchGameTab('tab-game-evidence', 3)"><i class="ph ph-microscope"></i></button>
        <button class="bottom-tab" onclick="window.switchGameTab('tab-game-items', 4)"><i class="ph ph-briefcase"></i></button>
    </nav>

</div>

<script>
    // ========================================================
    // نظام التحكم بقفل الشاشة السينمائية (Refresh Lock)
    // ========================================================
    const roomSessionKey = 'intro_played_for_' + (window.currentRoomId || 'global');
    
    if (sessionStorage.getItem(roomSessionKey)) {
        // إذا تم تشغيل الانترو مسبقاً في هذه المباراة، احذفه فوراً بدون عرض
        const overlay = document.getElementById('cinematic-overlay');
        if (overlay) overlay.remove();
    } else {
        // إذا كانت أول مرة يدخل الغرفة، نسجل الإشارة لكي لا يظهر عند التحديث
        sessionStorage.setItem(roomSessionKey, 'true');
    }

    // ========================================================
    // نظام التحكم المعماري الخاص بالأشرطة والأزرار
    // ========================================================
    window.cleanupGameUI = function() {
        document.body.classList.remove('in-game-mode');
        document.querySelectorAll('.game-injected-btn').forEach(b => b.remove());
    };

    window.initGameUI = function() {
        window.cleanupGameUI();
        document.body.classList.add('in-game-mode');

        const desktopMenu = document.querySelector('.sidebar .nav-menu');
        if(desktopMenu) {
            desktopMenu.insertAdjacentHTML('beforeend', `
                <button class="nav-btn game-injected-btn" onclick="window.switchGameTab('tab-game-settings', 0)"><i class="ph ph-gear"></i></button>
                <button class="nav-btn game-injected-btn" onclick="window.switchGameTab('tab-game-info', 1)"><i class="ph ph-identification-card"></i></button>
                <button class="nav-btn game-injected-btn active" onclick="window.switchGameTab('tab-game-accuse', 2)"><i class="ph-fill ph-gavel"></i></button>
                <button class="nav-btn game-injected-btn" onclick="window.switchGameTab('tab-game-evidence', 3)"><i class="ph ph-microscope"></i></button>
                <button class="nav-btn game-injected-btn" onclick="window.switchGameTab('tab-game-items', 4)"><i class="ph ph-briefcase"></i></button>
            `);
        }
    };

    window.switchGameTab = function(tabId, index) {
        document.querySelectorAll('.g-section-view').forEach(s => s.classList.remove('active'));
        const targetSec = document.getElementById(tabId);
        if(targetSec) targetSec.classList.add('active');

        const icons = ['ph-gear', 'ph-identification-card', 'ph-gavel', 'ph-microscope', 'ph-briefcase'];

        document.querySelectorAll('.sidebar .game-injected-btn').forEach((b, i) => {
            b.classList.toggle('active', i === index);
            const icon = b.querySelector('i');
            if(icon) icon.className = (i === index) ? `ph-fill ${icons[i]}` : `ph ${icons[i]}`;
        });

        document.querySelectorAll('.game-mobile-bar .bottom-tab').forEach((b, i) => {
            b.classList.toggle('active', i === index);
            const icon = b.querySelector('i');
            if(icon) icon.className = (i === index) ? `ph-fill ${icons[i]}` : `ph ${icons[i]}`;
        });
    };

    window.renderGameData = function() {
        try {
            if(!window.currentRoomData || !window.currentRoomData.roles) return;
            
            const myName = window.currentUserData ? window.currentUserData.username_lower : 'unknown';
            const allPlayers = window.currentRoomData.players || [];
            
            let myRole = 'investigator';
            for (const [k, v] of Object.entries(window.currentRoomData.roles)) {
                if (k.toLowerCase() === myName) { myRole = v; break; }
            }
            
            let myItems = null;
            if(window.currentRoomData.items) {
                for (const [k, v] of Object.entries(window.currentRoomData.items)) {
                    if (k.toLowerCase() === myName) { myItems = v; break; }
                }
            }

            const roleDiv = document.getElementById('render-game-role');
            if(myRole === 'murderer') {
                roleDiv.innerHTML = `<i class="ph-duotone ph-knife" style="font-size:6rem; color:var(--accent-red); margin-bottom:15px; filter: drop-shadow(0 0 15px rgba(242, 39, 123, 0.4));"></i><h2 style="color:white; font-size:2.8rem; font-weight:900; margin-bottom:10px;">أنت القاتل</h2><p style="color:var(--text-dim); font-size:1.1rem; max-width:400px; margin: 0 auto;">اختر سلاحك ودليلك وقم بخداعهم.</p>`;
            } else if(myRole === 'forensic') {
                roleDiv.innerHTML = `<i class="ph-duotone ph-microscope" style="font-size:6rem; color:#3498db; margin-bottom:15px; filter: drop-shadow(0 0 15px rgba(52, 152, 219, 0.4));"></i><h2 style="color:white; font-size:2.8rem; font-weight:900; margin-bottom:10px;">الطبيب الشرعي</h2><p style="color:var(--text-dim); font-size:1.1rem; max-width:400px; margin: 0 auto;">أنت تعرف القاتل. وجه المحققين عبر التلميحات.</p>`;
            } else {
                roleDiv.innerHTML = `<i class="ph-duotone ph-magnifying-glass" style="font-size:6rem; color:var(--accent-green); margin-bottom:15px; filter: drop-shadow(0 0 15px rgba(46, 204, 113, 0.4));"></i><h2 style="color:white; font-size:2.8rem; font-weight:900; margin-bottom:10px;">محقق</h2><p style="color:var(--text-dim); font-size:1.1rem; max-width:400px; margin: 0 auto;">اكتشف القاتل من خلال التلميحات والأدوات.</p>`;
            }

            const itemsDiv = document.getElementById('render-game-items');
            if(myItems && myItems.weapons) {
                let wHtml = myItems.weapons.map(w => `<span class="g-badge"><i class="ph-fill ph-crosshair" style="color:var(--accent-red);"></i>${w}</span>`).join('');
                let eHtml = myItems.evidence.map(e => `<span class="g-badge"><i class="ph-fill ph-fingerprint" style="color:#3498db;"></i>${e}</span>`).join('');
                itemsDiv.innerHTML = `
                    <div style="text-align:right;">
                        <h3 style="color:white; margin-bottom:15px; font-size:1.2rem;">الأسلحة المتاحة لك:</h3>
                        <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:35px;">${wHtml}</div>
                        <h3 style="color:white; margin-bottom:15px; font-size:1.2rem;">الآثار (الأدلة):</h3>
                        <div style="display:flex; flex-wrap:wrap; gap:12px;">${eHtml}</div>
                    </div>
                `;
            }

            const accuseGrid = document.getElementById('render-game-accuse');
            let accuseHtml = '';
            allPlayers.forEach(p => {
                let pItems = window.currentRoomData.items ? window.currentRoomData.items[p] : {weapons:[], evidence:[]};
                let wList = pItems.weapons ? pItems.weapons.map(w => `<span class="g-badge" style="font-size:0.8rem; padding:6px 10px;">${w}</span>`).join('') : '';
                let eList = pItems.evidence ? pItems.evidence.map(e => `<span class="g-badge" style="font-size:0.8rem; padding:6px 10px;">${e}</span>`).join('') : '';
                let isMe = (p.toLowerCase() === myName) ? `<span style="color:var(--accent-green); font-size:0.85rem; margin-right:5px;">(أنت)</span>` : '';
                
                accuseHtml += `
                    <div class="g-native-card" style="margin-bottom:0; cursor:pointer;" onclick="alert('توجيه اتهام لـ: ${p}')">
                        <div style="display:flex; align-items:center; gap:15px; margin-bottom:15px; border-bottom:1px dashed rgba(255,255,255,0.05); padding-bottom:15px;">
                            <div style="width:50px; height:50px; border-radius:50%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2rem; color:white;">${p.charAt(0).toUpperCase()}</div>
                            <div style="font-size:1.2rem; font-weight:800; color:white;">${p} ${isMe}</div>
                        </div>
                        <div style="font-size:0.85rem; color:var(--text-dim); margin-bottom:8px;">الأسلحة:</div>
                        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:15px;">${wList}</div>
                        <div style="font-size:0.85rem; color:var(--text-dim); margin-bottom:8px;">الأدلة:</div>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">${eList}</div>
                    </div>
                `;
            });
            accuseGrid.innerHTML = accuseHtml;

        } catch(e) { console.error("Error drawing UI", e); }
    };

    window.initGameUI();
    
    let retries = 0;
    function safeRender() {
        if(window.currentRoomData && window.currentRoomData.roles) window.renderGameData();
        else if(retries < 15) { retries++; setTimeout(safeRender, 500); }
    }
    safeRender();

    window.addEventListener('popstate', function cleanUp() {
        if(window.cleanupGameUI) window.cleanupGameUI();
        window.removeEventListener('popstate', cleanUp);
    });
</script>
