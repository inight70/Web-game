import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCLFj5UTX9EtuehoMWV02gkPsAgKPvMhzI",
    authDomain: "web-game-260b5.firebaseapp.com",
    projectId: "web-game-260b5",
    storageBucket: "web-game-260b5.firebasestorage.app",
    messagingSenderId: "682229509792",
    appId: "1:682229509792:web:11b4a404459630fcd6a3c5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.isGuest = false;
window.currentFormMode = 'login'; 

// مراقبة حالة اللاعب وتحديث الواجهة
onAuthStateChanged(auth, async (user) => {
    const dropdown = document.getElementById('user-dropdown');
    const avatar = document.getElementById('header-avatar');

    if (user) {
        window.isGuest = false;
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        let displayName = user.email.split('@')[0];
        let matches = 0;
        let wins = 0;

        if (userDoc.exists()) {
            const data = userDoc.data();
            displayName = data.username || displayName;
            matches = data.matches || 0;
            wins = data.wins || 0;
        }

        avatar.innerText = displayName.charAt(0).toUpperCase();
        
        dropdown.innerHTML = `
            <div class="dropdown-header">
                <div class="dropdown-name">${displayName}</div>
                <div class="dropdown-stats">
                    <div class="stat-item"><span class="stat-label">المباريات</span><span class="stat-value">${matches}</span></div>
                    <div class="stat-item"><span class="stat-label">الانتصارات</span><span class="stat-value">${wins}</span></div>
                </div>
            </div>
            <button class="dropdown-item" onclick="loadFragment('profile', document.querySelectorAll('.nav-btn')[4]); toggleUserDropdown();"><i class="ph ph-user-circle"></i> الملف الشخصي</button>
            <button class="dropdown-item logout" onclick="handleLogout()"><i class="ph ph-sign-out"></i> تسجيل الخروج</button>
        `;

        document.getElementById('auth-modal').classList.add('hidden');
        document.getElementById('app-shell').classList.add('unlocked');
        window.loadFragment('home', document.querySelector('.nav-btn'));
    } else {
        if (!window.isGuest) {
            document.getElementById('auth-modal').classList.remove('hidden');
            document.getElementById('app-shell').classList.remove('unlocked');
        }
    }
});

// نظام الدخول والتسجيل
window.handleAuthSubmit = async function(e) {
    e.preventDefault();
    const password = document.getElementById('input-password').value;
    const errorDiv = document.getElementById('auth-error');
    const submitBtn = document.getElementById('modal-submit-btn');
    
    errorDiv.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerText = "جاري التحقق...";

    try {
        if (window.currentFormMode === 'login') {
            let loginId = document.getElementById('input-email-username').value.trim();
            let loginEmail = loginId;

            if (!loginId.includes('@')) {
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("username", "==", loginId));
                const querySnapshot = await getDocs(q);
                
                if (querySnapshot.empty) {
                    throw { message: "اسم المستخدم غير موجود." };
                }
                loginEmail = querySnapshot.docs[0].data().email;
            }
            await signInWithEmailAndPassword(auth, loginEmail, password);

        } else {
            const username = document.getElementById('input-username-only').value.trim();
            const email = document.getElementById('input-email-only').value.trim();
            const confirmPass = document.getElementById('input-confirm').value;
            
            if (password !== confirmPass) throw { message: "كلمات المرور غير متطابقة." };
            
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                throw { message: "اسم المستخدم محجوز مسبقاً، اختر اسماً آخر." };
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                username: username,
                email: email,
                matches: 0,
                wins: 0,
                createdAt: new Date().toISOString()
            });
        }
    } catch (error) {
        let errorMsg = error.message;
        if (errorMsg.includes("credential") || errorMsg.includes("invalid-login")) {
            errorMsg = "بيانات الدخول غير صحيحة.";
        } else if (errorMsg.includes("email-already-in-use")) {
            errorMsg = "البريد الإلكتروني مستخدم مسبقاً.";
        }
        errorDiv.innerText = errorMsg;
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = window.currentFormMode === 'register' ? 'إنشاء الحساب' : 'دخول';
    }
}

// الدوال العامة للواجهة
window.toggleUserDropdown = function() { document.getElementById('user-dropdown').classList.toggle('show'); }

window.onclick = function(event) {
    if (!event.target.matches('.avatar-circle') && !event.target.closest('.user-dropdown')) {
        const dropdowns = document.getElementsByClassName("user-dropdown");
        for (let i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].classList.contains('show')) dropdowns[i].classList.remove('show');
        }
    }
}

window.handleLogout = function() {
    signOut(auth).then(() => {
        window.toggleUserDropdown();
        document.getElementById('auth-modal').classList.remove('hidden');
        document.getElementById('app-shell').classList.remove('unlocked');
    });
}

window.switchModalMode = function(mode) {
    if(mode === 'forms') {
        document.getElementById('modal-welcome-view').style.display = 'none';
        document.getElementById('modal-form-view').style.display = 'block';
    }
}

window.setFormType = function(type) {
    window.currentFormMode = type;
    document.getElementById('tab-login').classList.toggle('active', type === 'login');
    document.getElementById('tab-register').classList.toggle('active', type === 'register');
    
    document.getElementById('wrapper-login-id').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('wrapper-username-only').style.display = type === 'register' ? 'block' : 'none';
    document.getElementById('wrapper-email-only').style.display = type === 'register' ? 'block' : 'none';
    document.getElementById('wrapper-confirm').style.display = type === 'register' ? 'block' : 'none';
    
    document.getElementById('input-email-username').required = type === 'login';
    document.getElementById('input-username-only').required = type === 'register';
    document.getElementById('input-email-only').required = type === 'register';

    document.getElementById('modal-submit-btn').innerText = type === 'register' ? 'إنشاء الحساب' : 'دخول';
    document.getElementById('auth-error').style.display = 'none';
}

window.enterAsGuest = function() {
    window.isGuest = true;
    const avatar = document.getElementById('header-avatar');
    const dropdown = document.getElementById('user-dropdown');
    
    avatar.innerText = "ز";
    dropdown.innerHTML = `
        <div class="dropdown-header">
            <div class="dropdown-name" style="color: var(--text-dim);">زائر غير مسجل</div>
        </div>
        <button class="dropdown-item" onclick="document.getElementById('auth-modal').classList.remove('hidden'); toggleUserDropdown(); switchModalMode('forms'); setFormType('login');"><i class="ph ph-sign-in"></i> تسجيل الدخول لحفظ تقدمك</button>
    `;

    document.getElementById('auth-modal').classList.add('hidden');
    document.getElementById('app-shell').classList.add('unlocked');
    window.loadFragment('home', document.querySelector('.nav-btn'));
}

window.closeAuthModal = function() {
    document.getElementById('auth-modal').classList.add('hidden');
    document.getElementById('app-shell').classList.add('unlocked');
    if(!window.isGuest) window.enterAsGuest();
}

window.toggleTheme = function() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    if (body.getAttribute('data-theme') === 'light') {
        body.removeAttribute('data-theme');
        icon.className = 'ph ph-sun';
    } else {
        body.setAttribute('data-theme', 'light');
        icon.className = 'ph ph-moon';
    }
}

window.loadFragment = function(pageName, element) {
    const contentHolder = document.getElementById('content-holder');
    const titles = { 'home': 'الرئيسية', 'play': 'غرف اللعب', 'leaderboard': 'المتصدرون', 'store': 'متجر المزايا', 'profile': 'إعدادات الحساب' };
    
    document.getElementById('page-title').innerText = titles[pageName];
    document.querySelectorAll('.nav-btn, .bottom-tab').forEach(btn => btn.classList.remove('active'));
    if(element) element.classList.add('active');

    if (pageName === 'profile' && window.isGuest) {
        contentHolder.innerHTML = `
            <div style="padding: 40px; border: 1px solid var(--border-line); background-color: var(--surface-panel); border-radius: 20px; text-align: center; max-width: 500px; margin: 40px auto;">
                <i class="ph ph-user-circle-plus" style="font-size: 40px; margin-bottom: 15px; color: var(--text-dim);"></i>
                <h3 style="font-size: 18px; margin-bottom: 10px;">أنت تتصفح كزائر</h3>
                <p style="color: var(--text-dim); font-size: 13.5px; margin-bottom: 25px; line-height: 1.6;">قسم الحساب مخصص للاعبين المسجلين. أنشئ حسابك الآن لحفظ تقدمك.</p>
                <button class="btn-core" style="max-width: 200px; margin: 0 auto; display: block;" onclick="document.getElementById('auth-modal').classList.remove('hidden'); switchModalMode('forms');">سجل دخولك الآن</button>
            </div>`;
        return;
    }

    fetch(pageName + '.html')
        .then(response => { if (!response.ok) throw new Error(); return response.text(); })
        .then(html => { contentHolder.innerHTML = html; })
        .catch(() => {
            contentHolder.innerHTML = `
                <div style="padding: 40px; border: 1px dashed var(--border-line); border-radius: 16px; text-align: center;">
                    <p style="color: var(--text-dim); font-size: 14px;">ملف <b>${pageName}.html</b> غير موجود.</p>
                </div>`;
        });
}
