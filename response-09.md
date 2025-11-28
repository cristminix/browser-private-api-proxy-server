Tentu! Saya akan berikan contoh penggunaan **`Promise.all()`** dan **`Promise.allSettled()`** dalam JavaScript. Kedua metode ini digunakan untuk menangani beberapa _Promises_ secara bersamaan, tetapi mereka memiliki perilaku yang berbeda ketika salah satu _Promise_ gagal (ditolak/rejected).

---

## 1. `Promise.all()`

**`Promise.all()`** menunggu hingga **semua** _Promises_ yang diberikan selesai (fulfilled). Jika salah satu _Promise_ **gagal**, maka `Promise.all()` akan langsung **ditolak** (rejected) dengan alasan kegagalan _Promise_ pertama yang gagal, dan tidak akan menunggu _Promisesises_ yang tersisa.

### Contoh `Promise.all()` (Kasus Berhasil Semua)

```javascript
const promise1 = Promise.resolve(3)
const promise2 = 42 // Nilai non-Promise akan dianggap sebagai Promise yang langsung resolved
const promise3 = new Promise((resolve, reject) => {
  setTimeout(resolve, 100, "foo")
})

Promise.all([promise1, promise2, promise3])
  .then((values) => {
    // Dipanggil jika semua Promises BERHASIL
    console.log("Promise.all Berhasil:", values) // Output: [3, 42, 'foo']
  })
  .catch((error) => {
    // TIDAK akan dipanggil dalam kasus ini
    console.error("Promise.all Gagal:", error)
  })

//
```

### Contoh `Promise.all()` (Kasus Ada yang Gagal)

```javascript
const p1 = new Promise((resolve) => setTimeout(resolve, 500, "Satu"))
const p2 = new Promise((resolve, reject) =>
  setTimeout(reject, 100, "Kesalahan Cepat")
)
const p3 = new Promise((resolve) => setTimeout(resolve, 1000, "Tiga"))

Promise.all([p1, p2, p3])
  .then((values) => {
    // TIDAK akan dipanggil
    console.log("Promise.all Berhasil:", values)
  })
  .catch((error) => {
    // Dipanggil karena p2 GAGAL. Akan menangkap nilai kegagalan p2.
    console.error("Promise.all Gagal:", error) // Output: Kesalahan Cepat
  })

//
```

---

## 2\. `Promise.allSettled()`

**`Promise.allSettled()`** menunggu hingga **semua** _Promises_ yang diberikan telah **selesai** (**settled**), baik itu **berhasil** (fulfilled) maupun **gagal** (rejected). Hasilnya adalah _array_ objek yang menjelaskan status dan nilai/alasan dari setiap _Promise_.

### Contoh `Promise.allSettled()`

```javascript
const p_berhasil = new Promise((resolve) => setTimeout(resolve, 500, "Sukses!"))
const p_gagal = new Promise((resolve, reject) =>
  setTimeout(reject, 200, "Gagal!")
)
const p_lain = Promise.resolve("Lainnya")

Promise.allSettled([p_berhasil, p_gagal, p_lain]).then((results) => {
  // SELALU dipanggil setelah semua Promises selesai (settled)
  console.log("Promise.allSettled Selesai:")

  // Perhatikan struktur array hasilnya
  results.forEach((result, index) => {
    console.log(`Promise ${index + 1}: Status = ${result.status}`)
    if (result.status === "fulfilled") {
      console.log(`  Nilai: ${result.value}`)
    } else {
      console.log(`  Alasan Gagal: ${result.reason}`)
    }
  })

  /* Output (urutan mungkin sedikit berbeda tergantung eksekusi Promise):
    Promise.allSettled Selesai:
    Promise 1: Status = fulfilled
      Nilai: Sukses!
    Promise 2: Status = rejected
      Alasan Gagal: Gagal!
    Promise 3: Status = fulfilled
      Nilai: Lainnya
    */
})

//
```

---

### Perbedaan Utama (Kapan Menggunakan yang Mana?)

| Fitur                  | `Promise.all()`                                                                                           | \`Promise.allSettled()                                                                                                                        |
| :--------------------- | :-------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| **Perilaku Kegagalan** | **Gagal Cepat** (Fail-fast): Jika ada satu _Promise_ yang ditolak, keseluruhan akan ditolak segera.       | **Tunggu Semua**: Menunggu semua _Promises_ selesai, baik berhasil atau gagal.                                                                |
| **Output**             | _Array_ nilai-nilai yang berhasil (jika sukses semua).                                                    | _Array_ objek yang mendeskripsikan status dan hasil (nilai/alasan) setiap _Promise_.                                                          |
| **Kapan Digunakan**    | Ketika **semua** tugas harus berhasil, dan kegagalan satu tugas berarti seluruh operasi harus dibatalkan. | Ketika Anda ingin menjalankan beberapa tugas independen dan Anda perlu tahu **hasil dari setiap** tugas, terlepas dari apakah ada yang gagal. |

Apakah Anda ingin saya memberikan contoh lain yang lebih spesifik, seperti mengambil data dari API yang berbeda?
