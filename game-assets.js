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
    ],
    
    // ==========================================
    // نظام الشخصيات المتصل بالمتجر الذكي
    // ==========================================
    characters: [
        { id: 'c1', name: 'Lena', src: 'assets/images/characters/c1.png', price: 0 },
        { id: 'c2', name: 'Light', src: 'assets/images/characters/c2.png', price: 0 },
        { id: 'c3', name: 'Kira', src: 'assets/images/characters/c3.png', price: 0 },
        { id: 'c4', name: 'Ray', src: 'assets/images/characters/c4.png', price: 0 },
        { id: 'c5', name: 'Nova', src: 'assets/images/characters/c5.png', price: 0 },
        { id: 'c6', name: 'Zane', src: 'assets/images/characters/c6.png', price: 0 },
        
        { id: 'c7', name: 'Ciela', src: 'assets/images/characters/c7.png', price: 500 }, // متجر
        { id: 'c8', name: 'Vane', src: 'assets/images/characters/c8.png', price: 500 },  // متجر
        { id: 'c9', name: 'Lyra', src: 'assets/images/characters/c9.png', price: 800 },  // متجر
        
        { id: 'c10', name: 'Nero', src: 'assets/images/characters/c10.png', price: 0 },
        { id: 'c11', name: 'Axel', src: 'assets/images/characters/c11.png', price: 0 },
        { id: 'c12', name: 'Elara', src: 'assets/images/characters/c12.png', price: 0 },
        
        { id: 'c13', name: 'Orion', src: 'assets/images/characters/c13.png', price: 1500 } // متجر (شخصية أسطورية)
    ],

    // دالة الذكاء للتحقق من ملكية العناصر (تفصل بين المجاني والمدفوع)
    isOwned: function(userData, category, itemId) {
        if (!this[category]) return false;
        let item = this[category].find(i => i.id === itemId);
        if (!item) return false;
        
        // إذا كان السعر صفر فهو مجاني للجميع
        if (item.price === 0) return true;
        
        // إذا كان بفلوس، نفحص حقيبة اللاعب في قاعدة البيانات
        if (userData && userData.inventory && userData.inventory[category]) {
            return userData.inventory[category].includes(itemId);
        }
        
        return false;
    }
};

// ==========================================
// 2. مصنع الواجهات (UI Components)
// ==========================================
window.UI_COMPONENTS = {
    
    getBadgeHtml: function(badgeId, size = '40px', fontSize = '1.2rem') {
        let badgeObj = window.GAME_ASSETS.badges.find(b => b.id === badgeId) || window.GAME_ASSETS.badges[0];
        return `<div style="width: ${size}; height: ${size}; background: rgba(255,255,255,0.1); border: 2px dashed ${badgeObj.color}; color: ${badgeObj.color}; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: ${fontSize}; backdrop-filter: blur(5px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); flex-shrink: 0;"><i class="ph-fill ${badgeObj.icon}"></i></div>`;
    },

    getTitleHtml: function(titleStr) {
        if (!titleStr || titleStr === 'none' || titleStr.trim() === '') return '';
        return `<div style="font-size: 0.65rem; font-weight: 700; color: gold; text-transform: uppercase; letter-spacing: 1px; padding: 3px 10px; background: rgba(0,0,0,0.6); border-radius: 6px; backdrop-filter: blur(5px); border: 1px solid rgba(255,215,0,0.5); margin-top: 4px;">${titleStr}</div>`;
    },

    // الارتفاع الافتراضي هنا أصبح 85px ليكون شريطاً مستطيلاً عريضاً بدلاً من مربع
    buildEmblemCard: function(userData, height = "85px", hideAvatar = false) {
        if (!userData) userData = {};
        const safeName = userData.username || 'Unknown';
        const emblemSrc = userData.emblem || 'assets/images/default-emblem.png';
        
        const badgeHtml = this.getBadgeHtml(userData.badge || 'beginner', '38px', '1.1rem');
        const titleHtml = this.getTitleHtml(userData.title);

        let avatarHtml = '';
        if (!hideAvatar) {
            let avatarInner = `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:1.1rem; color:white;">${safeName.charAt(0).toUpperCase()}</div>`;
            if (userData.avatar) avatarInner = `<img src="${userData.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            avatarHtml = `<div style="width: 45px; height: 45px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index:3;">${avatarInner}</div>`;
        }

        return `
            <div style="position: relative; width: 100%; height: ${height}; border-radius: 20px; overflow: hidden; direction: ltr !important; background-color: var(--surface-panel); border: 1px solid rgba(255,255,255,0.05); box-shadow: var(--shadow-soft); transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
                <div style="position: absolute; inset: 0; background-image: url('${emblemSrc}'); background-size: cover; background-position: right center;"></div>
                <div style="position: relative; z-index: 2; height: 100%; display: flex; align-items: center; justify-content: flex-start; gap: 10px; padding: 0 15px;">
                    ${avatarHtml}
                    ${badgeHtml}
                    <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: center;">
                        <div style="font-size: 1.3rem; font-weight: 800; color: white; font-family: var(--font-en); letter-spacing: 0.5px; line-height: 1; text-shadow: 0 2px 8px rgba(0,0,0,0.9);">${safeName}</div>
                        ${titleHtml}
                    </div>
                </div>
            </div>
        `;
    }
};
