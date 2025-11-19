import { dbConfig } from "./config"
import { LmdbDb } from "./LmdbDb"
import path from "path"
// cuid tidak digunakan dalam contoh ini, jadi saya hapus
// Gunakan path relatif dari root direktori proyek
const kvstore = new LmdbDb(path.join(dbConfig.path, dbConfig.folder))

export { kvstore }
