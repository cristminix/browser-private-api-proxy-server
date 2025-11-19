import { open } from "lmdb"

class LmdbDb {
  private db: any
  private options: object

  constructor(dbPath: string, options: object = {}) {
    this.options = options
    this.db = open({
      path: dbPath,
      compression: true,
    })
  }
  getDb() {
    return this.db
  }
  async put(key: string, value: any): Promise<void> {
    if (!key || !value) {
      throw new Error("no key or value")
    }
    await this.db.put(key, value)
  }
  async get(key: string): Promise<any> {
    if (!key) {
      throw new Error("no key")
    }
    return await this.db.get(key)
  }
  async delete(key: string): Promise<void> {
    if (!key) {
      throw new Error("no key")
    }
    await this.db.remove(key)
  }
  async find(options: { prefix: string }): Promise<any[]> {
    const { prefix } = options
    const results: any[] = []

    try {
      // Gunakan iterator dengan rentang yang mencakup kunci yang dimulai dengan prefix
      const range = this.db.getRange({
        start: prefix,
        end: prefix + "\uffff", // Karakter Unicode tertinggi untuk rentang
      })

      // Iterasi manual karena LMDB tidak mendukung for await
      for (const entry of range) {
        // LMDB getRange mengembalikan objek dengan properti key dan value
        const key = entry.key
        const value = entry.value

        // Hanya tambahkan hasil jika kunci benar-benar dimulai dengan prefix
        if (key && key.startsWith(prefix)) {
          results.push({ key, value })
        }
      }
      return results
    } catch (error) {
      throw error
    }
  }
  async batch(arr: any[]): Promise<any[]> {
    if (!Array.isArray(arr)) {
      throw new Error("not array")
    }

    // Menyederhanakan logika batchList
    const batchList: Array<{ type: "put"; key: string; value: any } | { type: "del"; key: string }> = []

    arr.forEach((item) => {
      // Memastikan item memiliki properti yang diperlukan
      if (item.type === "put" && item.key && "value" in item) {
        batchList.push({
          type: "put" as const,
          key: item.key,
          value: item.value,
        })
      } else if (item.type === "del" && item.key) {
        batchList.push({
          type: "del" as const,
          key: item.key,
        })
      }
    })

    if (batchList.length === 0) {
      throw new Error("array Member format error")
    }

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

    return batchList
  }

  async close(): Promise<void> {
    await this.db.close()
  }
}

export { LmdbDb }
