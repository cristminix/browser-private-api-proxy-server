[dotenv@17.2.3] injecting env (1) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
Tentu! Saya akan berikan contoh penggunaan `Promise.all()` dan `Promise.allSettled()` dalam JavaScript beserta kasus penggunaannya.

---

## 💻 Promise.all()

`Promise.all()` digunakan untuk menjalankan beberapa Promise secara **paralel** dan menunggu hingga **semua** Promise selesai dieksekusi (*fulfilled*) atau **salah satu** dari Promise tersebut gagal (*rejected*).

### Contoh Kode

Dalam contoh ini, kita membuat tiga fungsi yang mengembalikan Promise. Dua berhasil dan satu memiliki penundaan yang lebih lama.ma.

```javascript
// Promise 1: Berhasil setelah 1 detik
const promise1 = new Promise((resolve, reject) => {
  setTimeout(() => resolve('Nilai dari Promise 1'), 1000);
});

// Promise 2: Berhasil setelah 500 milidetik
const promise2 = new Promise((resolve, reject) => {
  setTimeout(() => resolve('Nilai dari Promise 2'), 500);
});

// Promise 3: Berhasil setelah 2 detik
const promise3 = new Promise((resolve, reject) => {
  setTimeout(() => resolve('Nilai dari Promise 3'), 2000);
});

console.log('Memulai Promise.all()...');

Promise.all([promise1, promise2, promise3])
  .then((results) => {
    // Akan dipanggil jika SEMUA promise berhasil
    console.log('Semua Promise berhasil (Promise.all):');
    console.log(results); // Output: ['Nilai dari Promise 1', 'Nilai dari Promise 2', 'Nilai dari Promise 3'] (dalam urutan Promise yang diberikan)
  })
  .catch((error) => {
    // Akan dipanggil jika SALAH SATU promise GAGAL
    console.error('Promise.all gagal:', error);
  });
// Waktu total eksekusi akan sekitar 2 detik (sama dengan Promise terlama)
```

### ❌ Kasus Gagal (`Promise.all()`)

Jika kita ubah `promise2` menjadi gagal (*rejected*):

```javascript
const promiseA = new Promise((resolve, reject) => {
  setTimeout(() => resolve('A'), 1000);
});

const promiseB_Gagal = new Promise((resolve, reject) => {
  setTimeout(() => reject('Error: Promise B Gagal!'), 500); // REJECTED
});

Promise.all([promiseA, promiseB_Gagal])
  .then((results) => {
    // Tidak akan dipanggil
    console.log(results);
  })
  .catch((error) => {
    // LANGSUNG dipanggil saat promiseB_Gagal gagal, bahkan sebelum promiseA selesai.
    console.error('Promise.all gagal (Error Cepat):', error); // Output: Error: Promise B Gagal!
  });
```

### Kasus Penggunaan (`Promise.all()`)

  * \*\*Mengambil Data dari Beberapa API yang Sing Bergantung:** Anda perlu memuat profil pengguna, daftar teman, dan riwayat pesanan *sebelum* Anda dapat menampilkan halaman dashboard. Jika salah satu data gagal dimuat, Anda tidak bisa menampilkan dashboard dan harus memberi tahu pengguna.
  * **Melakukan Beberapa Pembaruan Basis Data yang Harus Atomik:** Anda perlu memperbarui dua atau lebih catatan dalam satu transaksi, dan jika salah satunya gagal, keseluruhan operasi harus dianggap gagal.

-----

## 🚀 Promise.allSettled()

`Promise.allSettled()` digunakan untuk menjalankan beberapa Promise secara paralel dan menunggu hingga **semua** Promise diselesaikan, \*\*terlepas dari apakah Promise tersebut berhasil (*fulfilled*) atau gagal (*rejected*).

### Contoh Kode

Menggunakan Promise yang sama dengan contoh gagal sebelumnya:

```javascript
const promise1 = new Promise((resolve, reject) => {
  setTimeout(() => resolve('Data 1 Berhasil'), 1000);
});

const promise2_Gagal = new Promise((resolve, reject) => {
  setTimeout(() => reject('Error: Gagal Ambil Data 2!'), 500); // REJECTED
});

const promise3 = new Promise((resolve, reject) => {
  setTimeout(() => resolve('Data 3 Berhasil'), 200);
});

console.log('Memulai Promise.allSettled()...');

Promise.allSettled([promise1, promise2_Gagal, promise3])
  .then((results) => {
    // SELALU dipanggil setelah semua promise selesai, baik berhasil atau gagal.
    console.log('Semua Promise selesai (Promise.allSettled):');
    console.log(results);
    /*
    Output:
    [
      { status: 'fulfilled', value: 'Data 1 Berhasil' },
      { status: 'rejected', reason: 'Error: Gagal Ambil Data 2!' },
      { status: 'fulfilled', value: 'Data 3 Berhasil' }
    ]
    */

    // Anda dapat memproses hasilnya di sini:
    const fulfilledResults = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    const rejectedReasons = results
      .filter(result => result.status === 'rejected')
      .map(result => result.reason);

    console.log('
Data Berhasil:', fulfilledResults);
    console.log('Alasan Gagal:', rejectedReasons);
  });
// Waktu total eksekusi akan sekitar 1 detik (sama dengan Promise terlama yang diselesaikan)
```

### Kasus Penggunaan (`Promise.allSettled()`)

  * \*\*Mengambil Berbagai Widget atauumber Data Independen:** Anda menampilkan halaman dengan berbagai widget (misalnya, Cuaca, Saham, Berita). Jika satu widget gagal memuat datanya, Anda tetap ingin menampilkan widget lainnya dan hanya menampilkan pesan *error* pada widget yang gagal.
  * \*\*Melakukan *Logging* atau Panggilan Notifikasi Mass:** Anda perlu mengirim email ke seratus pengguna. Anda ingin menunggu sampai semua upaya pengiriman selesai (berhasil atau gagal), sehingga Anda dapat mencatat hasilnya, tetapi kegagalan pada satu pengguna tidak boleh menghentikan pengiriman untuk pengguna lain.

-----

### Kapan Menggunakan yang Mana?

| Fitur | `Promise.all()` | `Promise.allSettled()` |
| :--- | :--- | :--- |
| \*\*Pyelesaian** | Dipenuhi HANYA jika semua berhasil. | Dipenuhi ketika SEMUA selesai (berhasil/gagal). |
| \*\*Kegalan** | Gagal segera setelah salah satu Promise gagal (*fail-fast*). | Tidak pernah gagal; selalu diselesaikan dengan array hasil. |
| **Output** | Array nilai hasil. | Array objek status/hasil (termasuk alasan kegagalan). |
| **Ideal Untuk** | Operasi yang **saling bergantung** dan harus berhasil semua. | Operasi **independen** di mana Anda ingin mencatat setiap hasil. |
