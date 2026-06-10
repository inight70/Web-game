// ==========================================
// 1. قاعدة بيانات عناصر اللعبة (Assets Data)
// ==========================================
window.GAME_ASSETS = {
    badges: [
        { id: 'beginner', name: 'مبتدئ', icon: 'ph-shield-star', color: '#ff4c6a', locked: false, req: '' },
        { id: 'veteran', name: 'مخضرم', icon: 'ph-sword', color: '#3498db', locked: false, req: 'مستوى 10' },
        { id: 'master', name: 'محترف', icon: 'ph-crown', color: '#f1c40f', locked: true, req: 'مستوى 50' }
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
// 2. مصنع الواجهات الموحدة (UI Components)
// ==========================================
window.UI_COMPONENTS = {
    getBadgeHtml: function(badgeId, size = '45px', fontSize = '1.4rem', isInteractive = false) {
        let badgeObj = window.GAME_ASSETS.badges.find(b => b.id === badgeId) || window.GAME_ASSETS.badges[0];
        let onClick = isInteractive ? `onclick="event.stopPropagation(); window.goToCustomization('badges')"` : '';
        let hoverStyle = isInteractive ? `cursor: pointer; transition: 0.2s;` : '';
        let hoverClass = isInteractive ? 'interactive-badge' : '';
        return `<div class="${hoverClass}" ${onClick} style="width: ${size}; height: ${size}; background: rgba(255,255,255,0.1); border: 2px dashed ${badgeObj.color}; color: ${badgeObj.color}; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: ${fontSize}; backdrop-filter: blur(5px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); flex-shrink: 0; ${hoverStyle}"><i class="ph-fill ${badgeObj.icon}"></i></div>`;
    },

    getTitleHtml: function(titleString, isInteractive = false) {
        let onClick = isInteractive ? `onclick="event.stopPropagation(); window.goToCustomization('titles')"` : '';
        let hoverStyle = isInteractive ? `cursor: pointer; transition: 0.2s;` : '';
        let hoverClass = isInteractive ? 'interactive-title' : '';
        
        if (!titleString || titleString === 'none' || titleString.trim() === '') {
            if (isInteractive) {
                return `<div class="${hoverClass}" ${onClick} style="font-size: 0.75rem; font-weight: 700; color: white; background: rgba(255,255,255,0.15); border: 1px dashed rgba(255,255,255,0.5); padding: 4px 12px; border-radius: 100px; ${hoverStyle}">إضافة لقب</div>`;
            }
            return '';
        }
        return `<div class="${hoverClass}" ${onClick} style="font-size: 0.75rem; font-weight: 700; color: gold; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; background: rgba(0,0,0,0.6); border-radius: 100px; backdrop-filter: blur(5px); border: 1px solid rgba(255,215,0,0.5); display: inline-block; ${hoverStyle}">${titleString}</div>`;
    },

    buildUnifiedEmblem: function(userData, height = "120px", hideAvatar = false, isProfileMode = false) {
        const emblemSrc = userData.emblem || 'assets/images/default-emblem.png';
        const badgeSize = isProfileMode ? '65px' : '50px';
        const badgeFontSize = isProfileMode ? '2.2rem' : '1.5rem';
        
        const badgeHtml = this.getBadgeHtml(userData.badge || 'beginner', badgeSize, badgeFontSize, isProfileMode);
        const titleHtml = this.getTitleHtml(userData.title, isProfileMode);

        let avatarHtml = '';
        if (!hideAvatar && !isProfileMode) {
            let avatarInner = `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:1.2rem; color:white;">${(userData.username || 'P').charAt(0).toUpperCase()}</div>`;
            if (userData.avatar) avatarInner = `<img src="${userData.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            avatarHtml = `<div style="width: 55px; height: 55px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index:3;">${avatarInner}</div>`;
        }

        let wrapperOnClick = isProfileMode ? `onclick="window.goToCustomization('emblems')"` : '';
        let hoverStyle = isProfileMode ? `cursor: pointer; transition: 0.3s;` : `transition: 0.3s;`;
        let hoverClass = isProfileMode ? 'interactive-emblem' : '';
        let nameFontSize = isProfileMode ? '2.6rem' : '1.5rem';
        let gap = isProfileMode ? '25px' : '15px';
        let padding = isProfileMode ? '0 40px' : '0 15px';
        let borderRadius = isProfileMode ? '24px' : '20px';

        return `
            <div class="${hoverClass}" ${wrapperOnClick} style="position: relative; width: 100%; height: ${height}; border-radius: ${borderRadius}; overflow: hidden; direction: ltr !important; background-color: var(--surface-panel); border: 2px solid transparent; box-shadow: var(--shadow-soft); ${hoverStyle}">
                <div style="position: absolute; inset: 0; background-image: url('${emblemSrc}'); background-size: cover; background-position: right center;"></div>
                <div style="position: relative; z-index: 2; height: 100%; display: flex; align-items: center; justify-content: flex-start; gap: ${gap}; padding: ${padding};">
                    ${avatarHtml}
                    ${badgeHtml}
                    <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 5px;">
                        <div style="font-size: ${nameFontSize}; font-weight: 800; color: white; font-family: var(--font-en); letter-spacing: 0.5px; line-height: 1; text-shadow: 0 4px 10px rgba(0,0,0,0.9); margin: 0;">${userData.username || 'Player'}</div>
                        ${titleHtml}
                    </div>
                </div>
            </div>
        `;
    }
};

// حقن تلقائي لستايلات التفاعل الخاصة بالامبلم بدون الحاجة لتعديل CSS الأساسي
const style = document.createElement('style');
style.innerHTML = `
    .interactive-emblem:hover { border-color: var(--accent-red) !important; transform: translateY(-3px); }
    .interactive-badge:hover { background: rgba(255, 76, 106, 0.4) !important; border-color: var(--accent-red) !important; transform: scale(1.1); }
    .interactive-title:hover { border-color: gold !important; background: rgba(0,0,0,0.8) !important; color: white !important; }
    .interactive-title[style*="dashed"]:hover { background: rgba(255,255,255,0.25) !important; border-color: white !important; }
`;
document.head.appendChild(style);
