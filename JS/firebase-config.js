// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot, writeBatch, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBXi3BiCIcVyuXGiUUI_UOAV-amuvrpBtY",
    authDomain: "siakad-mhs.firebaseapp.com",
    projectId: "siakad-mhs",
    storageBucket: "siakad-mhs.appspot.com",
    messagingSenderId: "122197341456",
    appId: "1:122197341456:web:940b33db306a36708a2195",
    measurementId: "G-R0Z25KCFHK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- GLOBAL HELPER: Show Message ---
function showMessage(type, text) {
    const container = document.getElementById('message-container');
    if (!container) return; // Prevent error if container missing
    const el = document.createElement('div');
    el.className = `message ${type}`;
    el.textContent = text;
    container.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(100%)';
        setTimeout(() => el.remove(), 300);
    }, 4000);
}

// --- GLOBAL HELPER: Check Login ---
// Fungsi ini dipanggil di setiap halaman KECUALI login page
function checkLoginStatus() {
    onAuthStateChanged(auth, user => {
        if (!user) {
            window.location.href = 'index.html'; // Redirect ke login jika belum login
        } else {
            const userInfo = document.getElementById('user-info');
            if(userInfo) userInfo.textContent = `Login sebagai: ${user.email}`;
        }
    });
}

// --- GLOBAL HELPER: Logout ---
function setupLogout() {
    const btn = document.getElementById('btn-logout');
    if(btn) {
        btn.addEventListener('click', () => {
            signOut(auth).then(() => window.location.href = 'index.html');
        });
    }
}

// --- KONFIGURASI ADMIN ---
const ADMIN_EMAIL = "admin@siakad.com"; // Ganti dengan email admin yang Anda mau

function isAdmin(user) {
    return user && user.email === ADMIN_EMAIL;
}

// Export fungsi dan variabel agar bisa dipakai file lain
export { 
    auth, db, 
    signInWithEmailAndPassword, createUserWithEmailAndPassword, 
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot, writeBatch, query, orderBy,
    showMessage, checkLoginStatus, setupLogout,
    isAdmin, ADMIN_EMAIL
};