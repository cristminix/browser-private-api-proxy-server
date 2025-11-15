import { dbConfig } from "./config";
import { LevelDb } from "./LevelDb";
import path from "path";
// cuid tidak digunakan dalam contoh ini, jadi saya hapus
// Gunakan path relatif dari root direktori proyek
const kvstore = new LevelDb(
  path.join(process.cwd(), dbConfig.path, dbConfig.folder)
);

export { kvstore };
