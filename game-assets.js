// ==========================================
// 1. قاعدة بيانات عناصر اللعبة (Assets Database)
// ==========================================
window.GAME_ASSETS = {
    badges: [
        { id: 'beginner', name: 'مبتدئ', icon: 'ph-shield-star', color: '#ff4c6a', locked: false, req: '' },
        { id: 'veteran', name: 'مخضرم', icon: 'ph-sword', color: '#3498db', locked: false, req: '' },
        { id: 'master', name: 'محترف', icon: 'ph-crown', color: '#f1c40f', locked: false, req: '' }
    ],
    titles: [
        { id: 'none', name: 'بدون لقب', locked: false, req: '' }
    ],
    emblems: [
        { id: 'default', name: 'الافتراضي', src: 'assets/images/default-emblem.png', locked: false, req: '' },
        { id: 'blue', name: 'افتراضي أزرق', src: 'assets/images/emblem-blue.png', locked: false, req: '' },
        { id: 'green', name: 'افتراضي أخضر', src: 'assets/images/emblem-green.png', locked: false, req: '' }
    ],
    maps: [
        { id: 'classic', name: 'الخريطة الكلاسيكية', src: 'assets/images/map-classic.png', locked: false, req: '' },
        { id: 'dark', name: 'خريطة الظلام', src: 'assets/images/map-dark.png', locked: true, req: 'مستوى 10' }
    ]
};

// ==========================================
// 2. مصنع الواجهات (UI Components)
// ==========================================
window.UI_COMPONENTS = {
    
    getBadgeHtml: function(badgeId, size = '45px', fontSize = '1.4rem') {
        let badgeObj = window.GAME_ASSETS.badges.find(b => b.id === badgeId) || window.GAME_ASSETS.badges[0];
        return `<div style="width: ${size}; height: ${size}; background: rgba(255,255,255,0.1); border: 2px dashed ${badgeObj.color}; color: ${badgeObj.color}; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: ${fontSize}; backdrop-filter: blur(5px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); flex-shrink: 0;"><i class="ph-fill ${badgeObj.icon}"></i></div>`;
    },

    getTitleHtml: function(titleStr) {
        if (!titleStr || titleStr === 'none' || titleStr.trim() === '') return '';
        return `<div style="font-size: 0.75rem; font-weight: 700; color: gold; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; background: rgba(0,0,0,0.6); border-radius: 8px; backdrop-filter: blur(5px); border: 1px solid rgba(255,215,0,0.5); margin-top: 5px;">${titleStr}</div>`;
    },

    buildEmblemCard: function(userData, height = "120px", hideAvatar = false) {
        // حماية متقدمة: إذا كانت البيانات فارغة، نضع قيم افتراضية حتى لا يعلق النظام
        if (!userData) userData = {};
        const safeName = userData.username || 'Unknown';
        const emblemSrc = userData.emblem || 'assets/images/default-emblem.png';
        const badgeHtml = this.getBadgeHtml(userData.badge || 'beginner', '50px', '1.5rem');
        const titleHtml = this.getTitleHtml(userData.title);

        let avatarHtml = '';
        if (!hideAvatar) {
            let avatarInner = `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:1.2rem; color:white;">${safeName.charAt(0).toUpperCase()}</div>`;
            if (userData.avatar) avatarInner = `<img src="${userData.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            avatarHtml = `<div style="width: 55px; height: 55px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index:3;">${avatarInner}</div>`;
        }

        return `
            <div style="position: relative; width: 100%; height: ${height}; border-radius: 20px; overflow: hidden; direction: ltr !important; background-color: var(--surface-panel); border: 1px solid rgba(255,255,255,0.05); box-shadow: var(--shadow-soft); transition: 0.3s;">
                <div style="position: absolute; inset: 0; background-image: url('${emblemSrc}'); background-size: cover; background-position: right center;"></div>
                <div style="position: relative; z-index: 2; height: 100%; display: flex; align-items: center; justify-content: flex-start; gap: 15px; padding: 0 15px;">
                    ${avatarHtml}
                    ${badgeHtml}
                    <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: center;">
                        <div style="font-size: 1.5rem; font-weight: 800; color: white; font-family: var(--font-en); letter-spacing: 0.5px; line-height: 1; text-shadow: 0 2px 5px rgba(0,0,0,0.8);">${safeName}</div>
                        ${titleHtml}
                    </div>
                </div>
            </div>
        `;
    }
};
