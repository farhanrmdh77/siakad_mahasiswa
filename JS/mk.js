// js/mk.js
import { db, collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, showMessage, checkLoginStatus, setupLogout, auth, isAdmin } from './firebase-config.js';

// Init
checkLoginStatus();
setupLogout();

const form = document.getElementById('form-mk');
const btnSubmit = form.querySelector('.submit');
const btnCancel = document.getElementById('btn-cancel');
let editingId = null;
let rawData = [];
let currentUser = null; // Variabel simpan user login

// --- 1. CEK USER SAAT LOAD ---
auth.onAuthStateChanged(user => {
    currentUser = user;
    
    // Jika BUKAN Admin, sembunyikan form input (Card dengan class .admin-only)
    if (!isAdmin(user)) {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
    
    // Render tabel ulang agar tombol aksi menyesuaikan
    renderTable();
});

// --- LISTENER DATA ---
onSnapshot(collection(db, "mk"), snap => {
    // Simpan data ke variabel global rawData dulu
    rawData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTable();
});

// --- RENDER TABLE ---
function renderTable() {
    const tbody = document.getElementById('mk-list');
    tbody.innerHTML = '';
    
    let no = 1;
    const isUserAdmin = isAdmin(currentUser); // Cek status admin

    rawData.forEach(item => {
        const tr = document.createElement('tr');
        
        // Logika Tombol Aksi (Admin Only)
        let actionButtons = '<span class="small" style="text-align:center; display:block;">-</span>';
        
        if (isUserAdmin) {
            actionButtons = `
                <div class="flex" style="justify-content: flex-end;">
                    <button class="btn secondary small btn-edit">Edit</button>
                    <button class="btn danger small btn-del">Hapus</button>
                </div>
            `;
        }

        tr.innerHTML = `
            <td class="no">${no++}</td>
            <td>${item.kode}</td><td>${item.nama}</td><td>${item.sks}</td>
            <td class="actions">
                ${actionButtons}
            </td>
        `;

        // Event Listener hanya untuk Admin
        if (isUserAdmin) {
            tr.querySelector('.btn-edit').onclick = () => {
                form.kode.value = item.kode; 
                form.nama.value = item.nama; 
                form.sks.value = item.sks;
                editingId = item.id; 
                btnSubmit.textContent = 'Update Data'; 
                btnCancel.classList.remove('hidden');
                form.scrollIntoView({ behavior: 'smooth' });
            };
            
            tr.querySelector('.btn-del').onclick = () => {
                if(confirm('Hapus Mata Kuliah ini?')) deleteDoc(doc(db, 'mk', item.id));
            };
        }

        tbody.appendChild(tr);
    });
}

// --- CRUD FUNCTION (Admin Only) ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validasi SKS
    const sksVal = Number(form.sks.value);
    if (isNaN(sksVal) || sksVal < 1 || sksVal > 6) {
         return showMessage('error', 'SKS harus angka 1-6.');
    }

    const payload = { kode: form.kode.value, nama: form.nama.value, sks: sksVal };
    try {
        if(editingId) await updateDoc(doc(db, 'mk', editingId), payload);
        else await addDoc(collection(db, 'mk'), payload);
        showMessage('success', 'Berhasil disimpan');
        reset();
    } catch(e) { showMessage('error', e.message); }
});

function reset() {
    form.reset(); 
    editingId = null; 
    btnSubmit.textContent = 'Simpan'; 
    btnCancel.classList.add('hidden');
}
btnCancel.onclick = reset;