# Migrasi dari Level ke LMDB

Dokumentasi ini menjelaskan proses migrasi dari database Level ke LMDB dalam proyek browser-private-api-proxy-server.

## Perubahan yang Dilakukan

### 1. Membuat File LmdbDb.ts

File baru `src/db/LmdbDb.ts` telah dibuat untuk mengimplementasikan fungsi-fungsi yang sama dengan `LevelDb.ts` tetapi menggunakan LMDB sebagai database backend.

Perbedaan utama antara implementasi Level dan LMDB:

- **Library**: Menggunakan `open` dari `lmdb` alih-alih `Level` dari `level`
- **Inisialisasi Database**: LMDB menggunakan `open()` dengan objek konfigurasi
- **Operasi Delete**: LMDB menggunakan `remove()` alih-alih `del()`
- **Operasi Batch**: LMDB menggunakan transaksi manual untuk operasi batch
- **Operasi Find/Range**: Implementasi yang berbeda untuk iterasi data dengan prefix

### 2. Memperbarui store.ts

File `src/db/store.ts` telah diperbarui untuk menggunakan `LmdbDb` alih-alih `LevelDb`:

```typescript
import { dbConfig } from "./config"
import { LmdbDb } from "./LmdbDb" // Diubah dari LevelDb
import path from "path"

const kvstore = new LmdbDb(path.join(process.cwd(), dbConfig.path, dbConfig.folder))

export { kvstore }
```

### 3. Kompatibilitas API

Kelas `LmdbDb` dirancang untuk memiliki API yang kompatibel dengan `LevelDb`:

- `put(key, value)`: Menyimpan data dengan key tertentu
- `get(key)`: Mengambil data berdasarkan key
- `delete(key)`: Menghapus data berdasarkan key
- `find({ prefix })`: Mencari data dengan prefix tertentu
- `batch(operations)`: Melakukan operasi batch (put/delete)
- `getDb()`: Mengambil instance database
- `close()`: Menutup koneksi database

## Perbedaan Implementasi

### 1. Inisialisasi Database

**Level:**

```typescript
this.db = new Level(dbPath, { valueEncoding: "json" })
```

**LMDB:**

```typescript
this.db = open({
  path: dbPath,
  compression: true,
})
```

### 2. Operasi Delete

**Level:**

```typescript
await this.db.del(key)
```

**LMDB:**

```typescript
await this.db.remove(key)
```

### 3. Operasi Find dengan Prefix

**Level:**

```typescript
const iterator = this.db.iterator({
  gt: prefix,
  lt: prefix + "z".repeat(10),
})

for await (const [key, val] of iterator) {
  if (key.startsWith(prefix)) {
    results.push({ key, value: val })
  }
}
```

**LMDB:**

```typescript
const range = this.db.getRange({
  start: prefix,
  end: prefix + "\uffff",
})

for (const entry of range) {
  const { key, value } = entry
  if (key.startsWith(prefix)) {
    results.push({ key, value })
  }
}
```

### 4. Operasi Batch

**Level:**

```typescript
await this.db.batch(batchList)
```

**LMDB:**

```typescript
const txn = this.db.transaction()
try {
  for (const operation of batchList) {
    if (operation.type === "put") {
      txn.put(operation.key, operation.value)
    } else if (operation.type === "del") {
      txn.remove(operation.key)
    }
  }
  await txn.commit()
} catch (error) {
  await txn.abort()
  throw error
}
```

## Verifikasi

Implementasi LMDB telah diuji dengan file `src/db/level-db-example.ts` dan berhasil:

1. Menyisipkan data administrator
2. Mencari data dengan prefix "administrator\_"
3. Menemukan data spesifik berdasarkan key

## Keuntungan LMDB

1. **Performa**: LMDB umumnya lebih cepat untuk operasi baca/tulis
2. **Konkurensi**: Mendukung akses konkuren tanpa locking
3. **Ukuran File**: Database LMDB cenderung lebih kompak
4. **Memory-Mapped**: Menggunakan memory-mapped files untuk efisiensi

## Catatan Penting

1. Data yang ada di database Level tidak akan otomatis tersedia di LMDB
2. Jika ada data penting di Level, perlu dilakukan migrasi data secara manual
3. Konfigurasi LMDB dapat disesuaikan lebih lanjut sesuai kebutuhan aplikasi
