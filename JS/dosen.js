// js/dosen.js
import { db, collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, showMessage, checkLoginStatus, setupLogout, auth, isAdmin } from './firebase-config.js';

// Init
checkLoginStatus();
setupLogout();

const form = document.getElementById('form-dosen');
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
onSnapshot(collection(db, "dosen"), snap => {
    // Simpan data ke variabel global rawData dulu
    rawData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTable();
});

// --- RENDER TABLE ---
function renderTable() {
    const tbody = document.getElementById('dosen-list');
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
            <td>${item.nidn}</td><td>${item.nama}</td><td>${item.jabatan}</td>
            <td class="actions">
                ${actionButtons}
            </td>
        `;

        // Event Listener hanya untuk Admin
        if (isUserAdmin) {
            tr.querySelector('.btn-edit').onclick = () => handleEdit(item);
            tr.querySelector('.btn-del').onclick = () => handleDelete(item.id);
        }

        tbody.appendChild(tr);
    });
}

// --- CRUD FUNCTION (Admin Only) ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Validasi sederhana
    if(!form.nidn.value || !form.nama.value) return showMessage('error', 'Data tidak lengkap');

    const payload = { nidn: form.nidn.value, nama: form.nama.value, jabatan: form.jabatan.value };
    try {
        if(editingId) await updateDoc(doc(db, 'dosen', editingId), payload);
        else await addDoc(collection(db, 'dosen'), payload);
        showMessage('success', 'Berhasil disimpan');
        reset();
    } catch(e) { showMessage('error', e.message); }
});

function handleEdit(item) {
    form.nidn.value = item.nidn; 
    form.nama.value = item.nama; 
    form.jabatan.value = item.jabatan;
    editingId = item.id; 
    btnSubmit.textContent = 'Update Data'; 
    btnCancel.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth' }); // Scroll ke form
}

function handleDelete(id) {
    if(confirm('Hapus data Dosen ini?')) deleteDoc(doc(db, 'dosen', id));
}

function reset() {
    form.reset(); 
    editingId = null; 
    btnSubmit.textContent = 'Simpan'; 
    btnCancel.classList.add('hidden');
}
btnCancel.onclick = reset;