// js/auth.js
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, showMessage, isAdmin } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// --- LOGIKA UTAMA: CEK STATUS LOGIN ---
onAuthStateChanged(auth, user => {
    if (user) {
        console.log("User ditemukan:", user.email); // Debugging 1
        
        // Tampilkan pesan
        showMessage('success', 'Login berhasil! Mengalihkan...');

        // Cek Admin atau User
        if (isAdmin(user)) {
            console.log("Status: ADMIN. OTW ke dashboard...");
        } else {
            console.log("Status: USER BIASA. OTW ke dashboard...");
        }

        // Tunda sebentar 1 detik biar pesan terbaca, lalu pindah
        setTimeout(() => {
            console.log("Mencoba pindah ke mahasiswa.html..."); // Debugging 2
            window.location.replace("mahasiswa.html"); // Gunakan replace agar tidak bisa back
        }, 1000);
    } else {
        console.log("Belum ada user login.");
    }
});

// --- TOMBOL LOGIN ---
document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try { 
        await signInWithEmailAndPassword(auth, email, pass); 
        // Tidak perlu redirect di sini, karena onAuthStateChanged di atas akan otomatis jalan
    } catch (e) { showMessage('error', "Login gagal: " + e.message); }
});

// --- TOMBOL REGISTER ---
document.getElementById('btn-register').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        showMessage('success', "Akun dibuat, sedang masuk...");
        // Tidak perlu redirect di sini, otomatis jalan via onAuthStateChanged
    } catch (e) { showMessage('error', "Registrasi gagal: " + e.message); }
});