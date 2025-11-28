[dotenv@17.2.3] injecting env (1) from .env -- tip: 🛠️ run anywhere with `dotenvx run -- yourcommand`
Tentu! Saya akan memberikan contoh penggunaan **`Promise.all()`** dan **`Promise.allSettled()`** di JavaScript.

Kedua metode ini berguna ketika Anda perlu mengelola **banyak _promises_ secara bersamaan**, tetapi memiliki perilaku yang berbeda terkait bagaimana mereka menangani kegagalan (_rejection_).

---

## 🚀 `Promise.all()`

**`Promise.all()`** menunggu semua _promises_ dalam _iterable_ (biasanya _array_) yang diberikan untuk **berhasil dipenuhi (_fulfilled_)**.

- Jika **semua** _promises_ berhasil, `Promise.all()` akan berhasil dengan _array_ dari nilai-nilai hasil.
- Jika **salah satu** _promises_ gagal (_rejected_), `Promise.all()` akan segera gagal dengan alasan kegagalan dari _promise_ pertama yang gagal. **Ini bersifat _fail-fast_**.

### Contoh `Promise.all()`

Dalam contoh ini, kita memiliki dua _promisesromises_ yang berhasil dan satu _promise_ yang gagal. Karena satu gagal, seluruh `Promise.all()` akan gagal.

```javascript
const promiseSatu = new Promise((resolve, reject) => {
  setTimeout(() => resolve("Hasil Satu"), 1000)
})

const promiseDua = new Promise((resolve, reject) => {
  setTimeout(() => resolve("Hasil Dua"), 500)
})

const promiseGagal = new Promise((resolve, reject) => {
  setTimeout(() => reject(new Error("Gagal di Promise Tiga")), 1500)
})

Promise.all([promiseSatu, promiseDua, promiseGagal])
  .then((hasil) => {
    // Blok ini TIDAK akan dieksekusi
    console.log("Semua Berhasil:", hasil)
  })
  .catch((error) => {
    // Blok ini akan dieksekusi karena promiseGagal gagal
    console.error("Setidaknya Satu Gagal:", error.message)
    // Output: Setidaknya Satu Gagal: Gagal di Promise Tiga
  })

// Contoh ketika SEMUA berhasil:
Promise.all([promiseSatu, promiseDua]).then((hasil) => {
  console.log("Semua Berhasil (Contoh Berhasil):", hasil)
  // Output: Semua Berhasil (Contoh Berhasil): ['Hasil Satu', 'Hasil Dua']
})
```

---

## ✅ `Promise.allSettled()`

\*\*\`Promise.Settled()`** menunggu hingga **semua** _promises_ dalam _iterable_ yang diberikan **diselesaikan (_settled_)\**, terlepas dari apakah mereka berhasil dipenuhi (*fulfilled*) atau gagal (*rejected\*).

- `Promise.allSettled()` selalu berhasil dan mengembalikan _array_ dari objek-objek hasil, yang masing-masing mendeskripsikan status dan nilai/alasan dari setiap _promise_. \*\*Ini tidak bersifat \*fail-t\*\*\*.

### Struktur Objek Hasil

Setiap elemen dalam _array_ hasil akan memiliki salah satu struktur ini:

1.  **Jika _filled_**: `{ status: "fulfilled", value: <nilai_hasil> }`
2.  **Jika _rejected_**: `{ status: "ejected", reason: <alasan_kegagalan> }`

### Contoh `Promise.allSettled()`

Dalam contoh ini, kita memiliki kedua _promises_ yang berhasil dan yang gagal, tetapi `Promise.allSettled()` akan menunggu keduanya selesai dan mengembalikan status dari masing-masing.

```javascript
const promiseSatu = new Promise((resolve, reject) => {
  setTimeout(() => resolve("Data Server A"), 1000)
})

const promiseGagal = new Promise((resolve, reject) => {
  setTimeout(() => reject(new Error("Timeout di Server B")), 2000)
})

const promiseTiga = new Promise((resolve, reject) => {
  setTimeout(() => resolve("Data Cache C"), 500)
})

Promise.allSettled([promiseSatu, promiseGagal, promiseTiga]).then((hasil) => {
  console.log("Semua Promise Selesai:")

  // Iterasi melalui hasil untuk melihat status masing-masing
  hasil.forEach((result, index) => {
    console.log(`Promise ${index + 1}:`)
    if (result.status === "fulfilled") {
      console.log(`  Status: ✅ ${result.status}, Nilai: ${result.value}`)
    } else {
      console.error(
        `  Status: ❌ ${result.status}, Alasan: ${result.reason.message}`
      )
    }
  })
})

/*
Output (setelah 2 detik):
Semua Promise Selesai:
Promise 1:
  Status: ✅ fulfilled, Nilai: Data Server A
Promise 2:
  Status: ❌ rejected, Alasan: Timeout di Server B
Promise 3:
  Status: ✅ fulfilled, Nilai: Data Cache C
*/
```

### 💡 Kapan Menggunakan yang Mana?

| Kriteria               | `Promise.all()`                                                                                                                                                                     | \`Promise.allSetted()`                                                                                                                                                                                                                 |
| :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Skenario Ideal**     | Anda membutuhkan **semua** sumber daya/data berhasil dimuat. Jika salah satu gagal, seluruh operasi tidak valid (misalnya, membuat profil pengguna baru yang butuh 3 data penting). | Anda ingin menjalankan semua tugas dan **mengumpulkan semua hasil**, terlepas dari keberhasilan atau kegagalan individual (misalnya, memuat 10 gambar yang berbeda di halaman web, Anda tetap ingin menampilkan yang berhasil dimuat). |
| **Perilaku Kegagalan** | \*\*Gagal-cepat (\*Failst\*)\*\*                                                                                                                                                    | **Tunggu semua selesai (_Wait-for-all_)**                                                                                                                                                                                              |

Apakah Anda ingin saya memberikan contoh yang lebih kompleks, misalnya cara menggunakan hasil `Promise.allSettled()` untuk memfilter hanya data yang berhasil?
