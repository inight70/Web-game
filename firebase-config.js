// استيراد أدوات فايربيس لتشغيل الحسابات وقاعدة البيانات اللحظية للعبة
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// مفتاح الربط السري الخاص بسيرفرك (الكامل والصحيح)
const firebaseConfig = {
  apiKey: "AIzaSyCLFj5UTX9EtuehoMWV02gkPsAgKPvMhzI",
  authDomain: "web-game-260b5.firebaseapp.com",
  projectId: "web-game-260b5",
  storageBucket: "web-game-260b5.firebasestorage.app",
  messagingSenderId: "682229509792",
  appId: "1:682229509792:web:11b4a404459630fcd6a3c5"
};

// تشغيل الاتصال بالسيرفر
const app = initializeApp(firebaseConfig);

// تجهيز نظام الحسابات (تسجيل الدخول) وقاعدة البيانات
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("تم الاتصال بسيرفر فايربيس بنجاح، والموقع جاهز!");
