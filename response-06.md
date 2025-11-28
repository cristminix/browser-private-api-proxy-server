[dotenv@17.2.3] injecting env (1) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
Tentu, berikut adalah contoh dan kasus penggunaan (`use case`) untuk `Promise.all()` dan `Promise.allSettled()` di JavaScript.

Kedua metode ini memungkinkan Anda untuk menjalankan beberapa operasi asinkron secara **paralel** dan menunggu hasilnya. Perbedaan utamanya terletak pada cara mereka menangani kegagalan (`rejection`).

---

## 🚀 Promise.all()

`Promise.all()` akan menunggu **semua** `Promise` dalam *iterable* (misalnya *array*) untuk berhasil **dipenuhi** (`fulfilled`).

* Jika **semua** *Promise* berhasil dipenuhi, `Promise.all()` akan *resolve* dengan sebuah *array* yang berisi nilai hasil dari setiap *Promise*, dalam urutan yang sama dengan *array* input.
* Jika **salah satu** *Promise* gagal (`rejected`), maka `Promise.all()` akan segera *reject* dengan alasan kegagalan dari *Promise* yang pertama kali gagal (*short-circt-circuited*). *Promise* lain yang mungkin masih berjalan tidak akan memengaruhi hasilnya.

### Contoh `Promise.all()`

```javascript
// Fungsi Promise simulasi
const ambilData = (id, durasi, berhasil = true) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (berhasil) {
                resolve(`Data ${id} berhasil diambil setelah ${durasi}ms`);
            } else {
                reject(new Error(`Gagal mengambil Data ${id}`));
            }
        }, durasi);
    });
};

const janji1 = ambilData(1, 1000); // Berhasil
const janji2 = ambilData(2, 500);  // Berhasil
const janji3_gagal = ambilData(3, 200, false); // Gagal

// Kasus 1: Semua berhasil
Promise.all([janji1, janji2])
    .then(hasil => {
        console.log("Kasus 1: Semua Berhasil");
        console.log(hasil); 
        // Output: ["Data 1 berhasil diambil setelah 1000ms", "Data 2 berhasil diambil setelah 500ms"]
    })
    .catch(error => {
        console.error("Kasus 1 Gagal:", error.message);
    });

// Kasus 2: Ada yang gagal (Promise.all() segera reject)
Promise.all([janji1, janji3_gagal, janji2])
    .then(hasil => {
        console.log("Kasus 2: Semua Berhasil");
        console.log(hasil);
    })
    .catch(error => {
        console.error("Kasus 2 Gagal:", error.message); 
        // Output: Kasus 2 Gagal: Gagal mengambil Data 3 (reject pertama)
    });
```

### Kasus Penggunaan (`Use Case`) `Promise.all()`

#### 1\. Memuat Sumber Daya Kritis

Digunakan ketika Anda perlu mengambil data dari **beberapa *endpoint* API** yang semuanya **kritis** dan diperlukan untuk merender atau menjalankan bagian utama aplikasi Anda.

  * **Skenario:** Memuat *Dashboard* pengguna.
  * **Aksi:** Anda perlu mengambil:
    * * Data Profil Pengguna (`fetch('/api/user/profile')`)
      * Pengaturan Aplikasi (`fetch('/api/user/settings')`)
      * Daftar Izin Pengguna (`fetch('/api/user/permissions')`)
  * **Alasan:** Jika salah satu gagal, *dashboard* tidak dapat berfungsi dengan benar, jadi lebih baik menampilkan pesan error tunggal dan mencegah *rendering* yang tidak lengkap.

<!-- end list -->

```javascript
Promise.all([
    fetch('/api/user/profile'),
    fetch('/api/user/settings'),
    fetch('/api/user/permissions')
])
.then(responses => {
    // Pastikan semua response OK sebelum parsing JSON
    return Promise.all(responses.map(res => res.json())); 
})
.then(([profil, pengaturan, izin]) => {
    // Lanjutkan dengan data yang lengkap
    renderDashboard(profil, pengaturan, izin);
})
.catch(error => {
    // Tampilkan pesan error jika ada satu saja request yang gagal
    displayFatalError('Gagal memuat semua data awal: ' + error.message);
});
```

-----

## 🌐 Promise.allSettled()

`Promise.allSettled()` akan menunggu **semua** `Promise` dalam *iterable* untuk **diselesaikan** (`settled`), terlepas dari apakah mereka berhasil dipenuhi (`fulfilled`) atau gagal (`rejected`).

  * Metode ini selalu **resolve**.
  * Ia *resolve* dengan sebuah *array* objek, di mana setiap objek mendeskripsikan hasil dari *Promise* yang sesuai:
      * Jika *fulfilled*: `{ status: 'fulfilled', value: hasil }`
      * Jika *rejected*: `{ status: 'rejected', reason: alasan\_kegagalan }

### Contoh `Promise.allSettled()`

```javascript
const janji1 = ambilData(1, 1000); // Berhasil
const janji2 = ambilData(2, 500);  // Berhasil
const janji3_gagal = ambilData(3, 200, false); // Gagal

Promise.allSettled([janji1, janji3_gagal, janji2])
    .then(hasil => {
        console.log("Hasil Promise.allSettled:");
        console.log(hasil);
        
        // Output:
        /*
        [
          { status: 'fulfilled', value: 'Data 1 berhasil diambil setelah 1000ms' },
          { status: 'rejected', reason: Error: Gagal mengambil Data 3 },
          { status: 'fulfilled', value: 'Data 2 berhasil diambil setelah 500ms' }
        ]
        */

        // Memproses setiap hasil
        hasil.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`Promise ${index + 1} Sukses: ${result.value}`);
            } else {
                console.warn(`Promise ${index + 1} Gagal: ${result.reason.message}`);
            }
        });
    });
```

### Kasus Penggunaan (`Use Case`) `Promise.allSettled()`

#### 2\. Tugas Independen yang Tidak Kritis

Digunakan ketika Anda memiliki banyak tugas asinkron yang **independen** satu sama lain, dan Anda ingin mengetahui hasil dari masing-masing tugas, **meskipun beberapa gagal**.

  * **Skenario:** Mengirim notifikasi atau *logging* ke beberapa layanan eksternal.
  * **Aksi:** Anda perlu:
      * Mengirim email notifikasi.
      * Mencatat aktivitas ke *log* audit.
      * Memperbarui statistik di layanan analitik.
  * **Alasan:** Jika pengiriman email gagal, Anda masih ingin melanjutkan dan mencatat aktivitas. Kegagalan satu tugas tidak boleh menghentikan yang lain. Anda memerlukan laporan lengkap tentang mana yang berhasil dan mana yang gagal.

<!-- end list -->

```javascript
const notifikasi = [
    kirimEmail('Selamat datang!'), // Promise
    logAudit('User registered'),    // Promise
    updateAnalytics('new_user'),    // Promise (mungkin gagal)
    kirimSMSPromo('Diskon 10%')     // Promise (mungkin gagal)
];

Promise.allSettled(notifikasi)
.then(results => {
    console.log("Laporan Status Pengiriman:");
    
    const gagal = results.filter(res => res.status === 'rejected');
    const sukses = results.filter(res => res.status === 'fulfilled');

    console.log(`Jumlah Sukses: ${sukses.length}`);
    if (gagal.length > 0) {
        console.warn(`Jumlah Gagal: ${gagal.length}. Lihat alasan untuk penanganan error.`);
        // Penanganan error khusus, misalnya mencoba lagi notifikasi yang gagal
    }
});
```

-----

## 📊 Perbandingan Singkat

| Fitur | `Promise.all()` | `Promise.allSettled()` |
| :--- | :--- | :--- |
| **Perilaku Kegagalan** | **Gagal segera** jika ada satu *Promise* yang *rejected*. | **Tidak pernah gagal**, menunggu semua *Promise* diselesaikan (baik *fulfilled* atau *rejected*). |
| **Nilai Hasil (*Resolve*)** | *Array* nilai jika semua berhasil (misal: `[v1, v2, v3]`). | *Array* objek hasil rinci (misal: `[{status: 'fulfilled', value: v1}, {status: 'rejected', reason: r2}]`). |
| **Kasus Terbaik** | Operasi yang **saling bergantung** atau **kritis**, di mana kegagalan satu berarti seluruh operasi tidak valid. | Operasi yang **independen** di mana Anda perlu tahu hasil dari setiap *Promise*, bahkan yang gagal. |

Apakah Anda ingin melihat contoh penggunaan `Promise.race()` atau `Promise.any()` juga?
