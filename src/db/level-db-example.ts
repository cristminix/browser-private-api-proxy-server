import { kvstore } from "./store"

// Administrator yang dibuat
let administrators = [
  {
    name: "DamonCote",
    email: "DamonCote7@gmail.com",
    password: "123456",
    id: "ckoyhjqbj0000mzkd1o63e31p",
  },
  {
    name: "JimGreen",
    email: "JimGreen@gmail.com",
    password: "123456",
    id: "ckoyhjqbk0001mzkdhuq9abo4",
  },
]
// administrators = [];
// Fungsi untuk menunggu semua operasi penyisipan selesai
async function insertAdministrators() {
  const keyPrefix = "administrator"
  console.info("====>Mulai menyisipkan data")
  const administratorsKeys = []

  for (const item of administrators) {
    const uid = item.id
    const keyName = `${keyPrefix}_${uid}`
    item.id = uid

    try {
      console.log(`Menyimpan data dengan key: ${keyName}`)
      await kvstore.put(keyName, item)
      console.log(`Berhasil menyimpan data dengan key: ${keyName}`)
      administratorsKeys.push(keyName)
    } catch (error) {
      console.error("Error inserting data:", error)
      throw error
    }
  }

  console.info("====>Menunggu semua data disisipkan sebelum mencari")

  // Tambahkan jeda kecil untuk memastikan semua data tertulis sebelum pencarian
  await new Promise((resolve) => setTimeout(resolve, 1000)) // Jeda 1 detik untuk memastikan data tertulis

  console.info("====>Mulai mencari data")
  // Mulai mencari uid untuk informasi pengguna ckoyhjqbj0000mzkd1o63e31p
  // Cari dengan prefix dasar agar bisa menemukan entri
  console.log(`Mencari data dengan prefix: ${keyPrefix}_`)
  try {
    const result = await kvstore.find({
      prefix: `${keyPrefix}_`, // Gunakan prefix yang lebih umum
    })
    console.log("Hasil pencarian:", result)
    // Filter hasil untuk mendapatkan entri spesifik
    const specificResult = result.find(
      (item: any) => item.key === `administrator_ckoyhjqbj0000mzkd1o63e31p`
    )
    if (specificResult) {
      console.log("Data spesifik ditemukan:", specificResult)
    } else {
      console.log("Data spesifik tidak ditemukan")
    }
  } catch (error) {
    console.error("Error saat mencari data:", error)
  }
}

// Panggil fungsi untuk mengeksekusi operasi
insertAdministrators().catch((error) => {
  console.error("Error in main execution:", error)
})
