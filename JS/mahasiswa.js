// js/mahasiswa.js
// PERBAIKAN 1: Menambahkan 'auth' dan 'isAdmin' ke dalam import
import { db, collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, writeBatch, showMessage, checkLoginStatus, setupLogout, auth, isAdmin } from './firebase-config.js';

// Init
checkLoginStatus();
setupLogout();

const formStudent = document.getElementById('form-student');
const btnSubmit = formStudent.querySelector('.btn.submit');
const btnCancel = document.getElementById('btn-cancel');
let editingId = null;
let rawData = [];
let currentUser = null; // Variabel untuk simpan user yang sedang login

// --- 1. CEK USER SAAT LOAD ---
auth.onAuthStateChanged(user => {
    currentUser = user;
    
    // Jika BUKAN Admin, sembunyikan fitur input/edit/hapus (Form & Import)
    if (!isAdmin(user)) {
        // Pastikan di HTML, card form input & import sudah dikasih class="admin-only"
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
    
    // Render ulang tabel untuk memastikan tombol aksi menyesuaikan status user terbaru
    renderTable();
});

// --- LISTENER ---
onSnapshot(collection(db, "mahasiswa"), snap => {
    rawData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTable();
});

// --- RENDER & SEARCH ---
function renderTable() {
    const term = document.getElementById('search-input').value.toLowerCase();
    const tbody = document.getElementById('students-list');
    tbody.innerHTML = '';
    
    // Sort by NIM
    const filtered = rawData
        .filter(d => d.nim.toString().includes(term) || d.nama.toLowerCase().includes(term))
        .sort((a,b) => String(a.nim).localeCompare(String(b.nim)));

    // PERBAIKAN 2: Cek status Admin sebelum looping
    const isUserAdmin = isAdmin(currentUser);

    let no = 1;
    filtered.forEach(item => {
        const tr = document.createElement('tr');

        // PERBAIKAN 3: Logika Tombol Aksi
        // Jika Admin -> Muncul Tombol. Jika User -> Muncul text '-'
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
            <td>${item.nim}</td><td>${item.nama}</td><td>${item.prodi}</td>
            <td class="actions">
                ${actionButtons}
            </td>
        `;

        // PERBAIKAN 4: Event Listener hanya dipasang jika user adalah ADMIN
        // Kalau user biasa, tombol '.btn-edit' tidak ada, jadi kode di bawah bakal error kalau dijalankan user biasa
        if (isUserAdmin) {
            tr.querySelector('.btn-edit').onclick = () => handleEdit(item);
            tr.querySelector('.btn-del').onclick = () => handleDelete(item.id);
        }

        tbody.appendChild(tr);
    });
}
document.getElementById('search-input').addEventListener('input', renderTable);

// --- CRUD (Hanya bisa dijalankan Admin karena Form disembunyikan untuk User) ---
formStudent.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nim = formStudent.nim.value.trim();
    if (!/^\d+$/.test(nim)) return showMessage('error', 'NIM harus angka.');

    const payload = { nim, nama: formStudent.nama.value, prodi: formStudent.prodi.value };
    try {
        if (editingId) {
            await updateDoc(doc(db, 'mahasiswa', editingId), payload);
            showMessage('success', 'Update berhasil.');
        } else {
            await addDoc(collection(db, 'mahasiswa'), payload);
            showMessage('success', 'Simpan berhasil.');
        }
        resetForm();
    } catch(err) { showMessage('error', err.message); }
});

function handleEdit(item) {
    formStudent.nim.value = item.nim;
    formStudent.nama.value = item.nama;
    formStudent.prodi.value = item.prodi;
    editingId = item.id;
    btnSubmit.textContent = 'Update Data';
    btnCancel.classList.remove('hidden');
    formStudent.scrollIntoView({ behavior: 'smooth' });
}

function handleDelete(id) {
    if(confirm('Hapus data ini?')) deleteDoc(doc(db, 'mahasiswa', id)).then(() => showMessage('success', 'Terhapus'));
}

function resetForm() {
    formStudent.reset();
    editingId = null;
    btnSubmit.textContent = 'Tambah Mahasiswa';
    btnCancel.classList.add('hidden');
}
btnCancel.onclick = resetForm;

// --- EXCEL UPLOAD ---
document.getElementById('btn-upload').onclick = () => {
    const file = document.getElementById('excel-file-input').files[0];
    if(!file) return showMessage('error', 'Pilih file dulu.');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        const batch = writeBatch(db);
        let count = 0;
        json.forEach(row => {
            if(row.nim && row.nama) {
                batch.set(doc(collection(db, 'mahasiswa')), { 
                    nim: String(row.nim), nama: row.nama, prodi: row.prodi || '-' 
                });
                count++;
            }
        });
        if(count > 0) { await batch.commit(); showMessage('success', `${count} data diimpor.`); }
    };
    reader.readAsArrayBuffer(file);
};