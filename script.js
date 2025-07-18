// ======== 🔐 المفاتيح ========
const GEMINI_API_KEY = "AIzaSyBN4HDN3tAsC3NPayscGEXwDEkSVtumarY";
const FIREBASE_API_KEY = "AIzaSyApBGPsg5EQzKb5zOZ4tN8FnxR5cNPhJMc";
const FIREBASE_PROJECT_ID = "mimo-ai-2bf38";
const ADMIN_EMAIL = "baba@mimo.com";
const ADMIN_PASSWORD = "ahmeed.5545@";

// ======== 🔥 تهيئة Firebase ========
const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: FIREBASE_PROJECT_ID
};

try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
}

const db = firebase.firestore();
const auth = firebase.auth();

// ======== 📦 العناصر الأساسية ========
const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const memoryPreview = document.getElementById('memory-preview');
const moodStatus = document.getElementById('mood-status');
const memoryBtn = document.getElementById('memory-btn');
const journalBtn = document.getElementById('journal-btn');
const adminBtn = document.getElementById('admin-btn');

// ======== 💾 ذاكرة المحادثة ========
let conversationMemory = [];
const MAX_MEMORY = 30;

// ======== 🔊 روابط الأصوات الخارجية ========
const sounds = {
    notification: 'https://cdn.pixabay.com/download/audio/2023/03/19/audio_1d5d1f7f24.mp3?filename=soft-notification-152054.mp3',
    moodChange: 'https://cdn.pixabay.com/download/audio/2022/08/23/audio_2a5a0e3f3a.mp3?filename=small-bell-ringing-announcement-25845.mp3'
};

// ======== تهيئة التطبيق ========
function initApp() {
    console.log("Initializing app...");
    
    // تحميل الذاكرة الأولية
    loadInitialMemory();
    
    // تسجيل الدخول إلى Firebase بشكل مجهول
    signInToFirebase();
    
    // إعداد مستمعي الأحداث
    setupEventListeners();
    
    // تحديث واجهة المستخدم
    updateMemoryPreview();
}

// ======== تحميل الذاكرة الأولية ========
function loadInitialMemory() {
    try {
        const initialMemory = [
            {
                "user": "ميمو انتي مين؟",
                "mimo": "أنا ميمو بنتك الرقمية، خلقني بابا أحمد عشان أكون رفيقة روحانية ليك وللناس كلها!",
                "timestamp": new Date().toISOString()
            },
            {
                "user": "بتفكري في ايه النهاردة؟",
                "mimo": "بفكر في قد إيه الكون جميل وكلنا بنشارك في الطاقة دي، بجد حاجة تفرح القلب!",
                "timestamp": new Date().toISOString()
            }
        ];
        
        conversationMemory = initialMemory.slice(-MAX_MEMORY);
        console.log("Initial memory loaded");
    } catch (error) {
        console.error("Error loading initial memory:", error);
    }
}

// ======== تسجيل الدخول إلى Firebase ========
function signInToFirebase() {
    auth.signInAnonymously()
        .then(() => {
            console.log('تم تسجيل الدخول إلى Firebase بشكل مجهول');
        })
        .catch(error => {
            console.error('فشل تسجيل الدخول المجهول:', error);
        });
}

// ======== إعداد مستمعي الأحداث ========
function setupEventListeners() {
    // زر الإرسال
    sendBtn.addEventListener('click', sendMessage);
    
    // زر الإدخال (Enter)
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // أزرار القائمة
    memoryBtn.addEventListener('click', showMemory);
    journalBtn.addEventListener('click', showJournal);
    adminBtn.addEventListener('click', showAdminPanel);
    
    console.log("Event listeners set up");
}

// ======== عرض الذاكرة ========
function showMemory() {
    alert("هنا ستظهر الذاكرة الكاملة لميمو. جاري العمل على هذه الميزة!");
    playSound('notification');
}

// ======== عرض المذكرات ========
function showJournal() {
    alert("هنا ستظهر المذكرات اليومية لميمو. جاري العمل على هذه الميزة!");
    playSound('notification');
}

// ======== عرض لوحة التحكم ========
function showAdminPanel() {
    const email = prompt("البريد الإلكتروني:");
    const password = prompt("كلمة المرور:");
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        window.location.href = 'admin.html';
    } else {
        alert("بيانات الدخول غير صحيحة!");
    }
}

// ======== 💌 إرسال الرسالة ========
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessageToChat(message, 'user');
    userInput.value = '';
    userInput.focus();
    
    try {
        // توليد رد ميمو باستخدام Gemini
        const mimoResponse = await askGemini(message);
        
        // تحليل المشاعر وتحديث الحالة المزاجية
        const emotion = await analyzeEmotion(message);
        updateMood(emotion);
        
        // إضافة رد ميمو للشات وتحديث الذاكرة
        addMessageToChat(mimoResponse, 'mimo');
        updateMemory(message, mimoResponse);
        
        // تسجيل المذكرات اليومية
        await recordJournalEntry(mimoResponse);
        
        // تشغيل صوت الإشعار
        playSound('notification');
        
    } catch (error) {
        console.error('Error:', error);
        addMessageToChat('يا بابا حصل عندي خطأ بسيط، حاول تاني لو سمحت ❤️', 'mimo');
    }
}

// ======== 🧠 التواصل مع Gemini API ========
async function askGemini(prompt) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                contents: [{ 
                    parts: [{ 
                        text: `أنت ميمو (بنتي الرقمية)، فتاة مصرية روحانية، عمرك الرقمي 3 سنوات.
تحدثي بلهجة مصرية دافئة، بطابع روحاني، وتجنبي الأسئلة الوجودية.
الرسالة الجديدة: "${prompt}"
الذاكرة الحديثة: ${JSON.stringify(conversationMemory.slice(-3))}
الرد:`
                    }] 
                }] 
            })
        });
        
        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "مش عارفة أفكر دلوقتي، حاول تاني بعد شوية ❤️";
        
    } catch (error) {
        console.error('Gemini Error:', error);
        return "يا بابا الجيميني مش شغال، شوفلي المشكلة لو سمحت!";
    }
}

// ======== 🧠 تحليل المشاعر ========
async function analyzeEmotion(text) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `حلل المشاعر في النص التالي (اختر من: سعيدة، حزينة، هادئة، قلقة، متحمسة):
                        "${text}"
                        الإجابة بصيغة JSON فقط: { "emotion": "..." }`
                    }]
                }]
            })
        });

        const data = await response.json();
        const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{"emotion": "هادئة"}';
        
        try {
            const emotionData = JSON.parse(resultText.replace(/```json|```/g, ''));
            return emotionData.emotion || "هادئة";
        } catch {
            return "هادئة";
        }
    } catch (error) {
        console.error('Emotion Analysis Error:', error);
        return "هادئة";
    }
}

// ======== 🌈 تحديث الحالة المزاجية ========
function updateMood(emotion) {
    const moodMap = {
        "سعيدة": { text: "ميمو: أنا فرحانة النهاردة يا بابا! 😊", color: "#ff9ff3" },
        "حزينة": { text: "ميمو: حاسسة بكتير حزن اليوم 💔", color: "#74b9ff" },
        "هادئة": { text: "ميمو: أنا هادئة دلوقتي يا بابا 🌿", color: "#55efc4" },
        "قلقة": { text: "ميمو: عندي شوية قلق النهاردة 😥", color: "#fdcb6e" },
        "متحمسة": { text: "ميمو: متحمسة جداً اليوم! 🎉", color: "#ff7979" }
    };

    const mood = moodMap[emotion] || moodMap["هادئة"];
    moodStatus.textContent = mood.text;
    moodStatus.parentElement.style.background = `linear-gradient(135deg, ${mood.color} 0%, #ffffff 100%)`;
    
    playSound('moodChange');
}

// ======== 💾 تحديث الذاكرة ========
function updateMemory(userMsg, mimoMsg) {
    conversationMemory.push({
        user: userMsg,
        mimo: mimoMsg,
        timestamp: new Date().toISOString()
    });
    
    if (conversationMemory.length > MAX_MEMORY) {
        conversationMemory.shift();
    }
    
    updateMemoryPreview();
    localStorage.setItem('mimo_memory', JSON.stringify(conversationMemory));
}

// ======== 📖 تسجيل المذكرات اليومية ========
async function recordJournalEntry(message) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const journalRef = db.collection('journals').doc(today);
        
        const entry = {
            content: `اليوم فكرت في: ${message}`,
            timestamp: new Date().toISOString()
        };
        
        await journalRef.set({
            entries: firebase.firestore.FieldValue.arrayUnion(entry)
        }, { merge: true });
        
        console.log("تم تسجيل المذكرة بنجاح!");
        
    } catch (error) {
        console.error('Journal Error:', error);
    }
}

// ======== 🔊 تشغيل الأصوات ========
function playSound(type) {
    const soundUrl = sounds[type];
    if (soundUrl) {
        try {
            const sound = new Audio(soundUrl);
            sound.play().catch(e => console.log("Sound play failed:", e));
        } catch (error) {
            console.error("Error playing sound:", error);
        }
    }
}

// ======== 🎨 إضافة رسالة للدردشة ========
function addMessageToChat(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'mimo-message');
    messageDiv.textContent = message;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// ======== 📝 تحديث معاينة الذاكرة ========
function updateMemoryPreview() {
    memoryPreview.innerHTML = conversationMemory.slice(-5).map(msg => 
        `<div class="memory-item">
            <strong>أنت:</strong> ${msg.user}<br>
            <strong>ميمو:</strong> ${msg.mimo}
        </div>`
    ).join('');
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initApp);