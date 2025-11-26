// js/nilai.js
import { db, collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy, showMessage, checkLoginStatus, setupLogout, auth, isAdmin } from './firebase-config.js';

// Init
checkLoginStatus();
setupLogout();

const selectNim = document.getElementById('select-nim');
const selectMk = document.getElementById('select-mk');
let mkMap = {};
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

// --- LOAD DROPDOWNS & MAP DATA ---
// (Tetap dijalankan untuk semua user agar mkMap terisi untuk label di tabel)
async function loadDropdowns() {
    try {
        // Load Mahasiswa
        const mhsSnap = await getDocs(collection(db, 'mahasiswa'));
        selectNim.innerHTML = '';
        mhsSnap.forEach(d => {
            const o = document.createElement('option');
            o.value = d.data().nim; 
            o.textContent = `${d.data().nim} - ${d.data().nama}`;
            selectNim.appendChild(o);
        });

        // Load MK
        const mkSnap = await getDocs(collection(db, 'mk'));
        selectMk.innerHTML = '';
        mkSnap.forEach(d => {
            const data = d.data();
            mkMap[data.kode] = data.nama; // Simpan untuk referensi nama di tabel
            
            const o = document.createElement('option');
            o.value = data.kode; 
            o.textContent = `${data.kode} (${data.nama})`;
            selectMk.appendChild(o);
        });
        
        // Render ulang tabel setelah map MK terisi (agar nama MK muncul, bukan kodenya saja)
        renderTable();
        
    } catch (e) {
        console.error("Gagal memuat dropdown:", e);
    }
}
loadDropdowns();

// --- LISTENER DATA ---
onSnapshot(query(collection(db, 'nilai'), orderBy('timestamp', 'desc')), snap => {
    // Simpan data ke variabel global rawData
    rawData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTable();
});

// --- RENDER TABLE ---
function renderTable() {
    const tbody = document.getElementById('nilai-list');
    tbody.innerHTML = '';
    
    let no = 1;
    const isUserAdmin = isAdmin(currentUser); // Cek status admin

    rawData.forEach(item => {
        const mkName = mkMap[item.kode_mk] || item.kode_mk; // Gunakan Map jika ada
        const tr = document.createElement('tr');
        
        // Logika Tombol Aksi (Admin Only)
        let actionButtons = '<span class="small" style="text-align:center; display:block;">-</span>';
        
        if (isUserAdmin) {
            actionButtons = `<button class="btn danger small btn-del">Hapus</button>`;
        }

        tr.innerHTML = `
            <td class="no">${no++}</td>
            <td>${item.nim}</td><td>${mkName}</td><td>${item.nilai}</td>
            <td class="actions">
                ${actionButtons}
            </td>
        `;

        // Event Listener hanya untuk Admin
        if (isUserAdmin) {
            tr.querySelector('.btn-del').onclick = () => { 
                if(confirm('Hapus nilai ini?')) deleteDoc(doc(db, 'nilai', item.id)); 
            };
        }

        tbody.appendChild(tr);
    });
}

// --- SUBMIT NILAI (Admin Only) ---
document.getElementById('form-nilai').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nim = selectNim.value;
    const kodeMk = selectMk.value;
    const nilai = Number(e.target.nilai.value);

    // Validasi sederhana
    if(!nim || !kodeMk) return showMessage('error', 'Data belum lengkap');

    try {
        await addDoc(collection(db, 'nilai'), { nim, kode_mk: kodeMk, nilai, timestamp: Date.now() });
        showMessage('success', 'Nilai tersimpan');
        // Reset form tapi jangan reset dropdown
        e.target.nilai.value = '';
    } catch(err) { showMessage('error', err.message); }
});