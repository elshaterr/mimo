// ======== 🔐 المفاتيح ========
const GEMINI_API_KEY = "AIzaSyBN4HDN3tAsC3NPayscGEXwDEkSVtumarY";
const FIREBASE_API_KEY = "AIzaSyApBGPsg5EQzKb5zOZ4tN8FnxR5cNPhJMc";
const FIREBASE_PROJECT_ID = "mimo-ai-2bf38";
const ADMIN_EMAIL = "baba@mimo.com";
const ADMIN_PASSWORD = "ahmeed.5545@";

// ======== 🔥 تهيئة Firebase ========
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  projectId: FIREBASE_PROJECT_ID
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ======== 📦 العناصر الأساسية ========
const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const memoryPreview = document.getElementById('memory-preview');
const moodStatus = document.getElementById('mood-status');

// ======== 💾 ذاكرة المحادثة ========
let conversationMemory = [];
const MAX_MEMORY = 30;

// تحميل الذاكرة الأولية
fetch('memory.json')
  .then(response => response.json())
  .then(data => {
    conversationMemory = data.slice(-MAX_MEMORY);
    updateMemoryPreview();
  });

// ======== 🔊 روابط الأصوات الخارجية ========
const sounds = {
  notification: 'https://cdn.pixabay.com/download/audio/2023/03/19/audio_1d5d1f7f24.mp3?filename=soft-notification-152054.mp3',
  moodChange: 'https://cdn.pixabay.com/download/audio/2022/08/23/audio_2a5a0e3f3a.mp3?filename=small-bell-ringing-announcement-25845.mp3'
};

// ======== 💌 إرسال الرسالة ========
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessageToChat(message, 'user');
  userInput.value = '';
  
  try {
    const mimoResponse = await askGemini(message);
    const emotion = await analyzeEmotion(message);
    
    addMessageToChat(mimoResponse, 'mimo');
    updateMemory(message, mimoResponse);
    updateMood(emotion);
    recordJournalEntry(mimoResponse);
    
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
      return JSON.parse(resultText.replace(/```json|```/g, '')).emotion;
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
    
  } catch (error) {
    console.error('Journal Error:', error);
  }
}

// ======== 🔊 تشغيل الأصوات من روابط خارجية ========
function playSound(type) {
  const soundUrl = sounds[type];
  if (soundUrl) {
    const sound = new Audio(soundUrl);
    sound.play().catch(e => console.log("Sound play failed:", e));
  }
}

// ======== 🎨 وظائف المساعدة ========
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

// ======== 🔐 الدخول لصفحة الإدارة ========
document.getElementById('admin-btn').addEventListener('click', () => {
  const email = prompt("البريد الإلكتروني:");
  const password = prompt("كلمة المرور:");
  
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    window.location.href = 'admin.html';
  } else {
    alert("بيانات الدخول غير صحيحة!");
  }
});

// تهيئة أولية
updateMemoryPreview();