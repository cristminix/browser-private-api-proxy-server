[dotenv@17.2.3] injecting env (1) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
undefined
Tentu! **Fetch API** di JavaScript adalah antarmuka modern yang berbasis **Promise** untuk membuat **permintaan HTTP** (atau *network request*) guna mengambil sumber daya (seperti data, gambar, atau file) dari server.

---

## 💡 Konsep Utama Fetch API

* **Pengganti Modern:** `Fetch` adalah pengganti yang lebih baru dan lebih fleksibel dari `XMLHttpRequest` (XHR) yang lebih tua.
* **Berbasis Promise:** Fungsi `fetch()` mengembalikan **Promise**. Ini membuatnya lebih mudah untuk menangani operasi asinkron (mengambil data di latar belakang) menggunakan `.then()` atau `async/await`.
* **Tersedia Secara Global:** Metode `fetch()` tersedia secara global (di objek `window` di browser dan konteks *worker*).
* **Mengambil Sumber Daya:** Biasanya digunakan untuk berinteraksi dengan **API** (Application Programming Interface) *backend* untuk mengambil atau mengirim data secara asinkron melalui web.

---

## 🛠️ Cara Kerja Dasar `fetch()`

Ketika Anda memanggil `fetch()`, ia melakukan langkah-langkah berikut:

1.  **Membuat Permintaan:** Anda memanggil `fetch()` dengan URL sumber daya yang ingin diambil.
2.  **Mengembalikan Promise:** `fetch()` segera mengembalikan **Promise**.
    * *Promise ini terpenuhi (resolve)* dengan objek **Response** segera setelah server mengirimkan **header**, bahkan jika status responsnya adalah *HTTP error* (misalnya, 404 Not Found atau 500 Internal Server Error). Promise hanya akan *ditolak (reject)* jika terjadi **kesalahan jaringan** (misalnya, koneksi terputus).
3.  **Memproses Respons:** Objek **Response** memiliki metode untuk mengekstrak *body* (isi) dari respons dalam berbagai format (misalnya, `.json()`, `.text()`).
    * Metode seperti `.json()` juga mengembalikan **Promise**, karena parsing data bisa memakan waktu.a memakan waktu.

## 📝 Sintaks Dasar

Sintaks paling sederhana untuk permintaan **GET** adalah:

```javascript
fetch('URL_API_ANDA')
  .then(response => {
    // 1. Periksa status HTTP untuk kesalahan non-jaringan
    if (!response.ok) {
      throw new Error('Network response was not ok: ' + response.statusText);
    }
    // 2. Mengubah body respons menjadi JSON
    return response.json();
  })
  .then(data => {
    // 3. Menggunakan data yang sudah diparsing
    console.log(data);
  })
  .catch(error => {
    // 4. Menangani kesalahan jaringan atau kesalahan yang dilempar
    console.error('There was a problem with the fetch operation:', error);
  });
```

Atau menggunakan `async/await` (lebih sering digunakan karena lebih mudah dibaca):

```javascript
async function getData() {
  try {
    const response = await fetch('URL_API_ANDA');

    if (!response.ok) {
      throw new Error('HTTP error! status: ' + response.status);
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Fetch failed:', error);
  }
}

getData();
```

-----

## ⚙️ Permintaan POST (Mengirim Data)

Untuk permintaan selain `GET` (seperti `POST`, `PUT`, `DELETE`), Anda perlu menambahkan objek konfigurasi (sering disebut objek `init`) sebagai argumen kedua dari `fetch()`:

```javascript
const postData = {
  title: 'foo',
  body: 'bar',
  userId: 1,
};

fetch('URL_POST_ANDA', {
  method: 'POST', // Menentukan metode HTTP
  headers: {
    'Content-Type': 'application/json', // Menentukan tipe konten body
  },
  body: JSON.stringify(postData), // Mengkonversi objek JavaScript ke string JSON
})
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

Apakah Anda ingin melihat contoh penggunaan Fetch API untuk mengambil data dari API publik tertentu?
