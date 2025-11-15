import { Level } from "level";

class LevelDb {
  private db: Level<string, any>;
  private options: object;

  constructor(dbPath: string, options: object = {}) {
    this.options = options;
    this.db = new Level(dbPath, { valueEncoding: "json" });
  }
  getDb() {
    return this.db;
  }
  async put(key: string, value: any): Promise<void> {
    if (!key || !value) {
      throw new Error("no key or value");
    }
    await this.db.put(key, value);
  }
  async get(key: string): Promise<any> {
    if (!key) {
      throw new Error("no key");
    }
    return await this.db.get(key);
  }
  async delete(key: string): Promise<void> {
    if (!key) {
      throw new Error("no key");
    }
    await this.db.del(key);
  }
  async find(options: { prefix: string }): Promise<any[]> {
    const { prefix } = options;
    const results: any[] = [];

    // Gunakan iterator dengan rentang yang mencakup kunci yang dimulai dengan prefix
    const iterator = this.db.iterator({
      gt: prefix,
      lt: prefix + "z".repeat(10), // Gunakan string yang leksikografis setelah prefix
    });

    try {
      for await (const [key, val] of iterator) {
        // Hanya tambahkan hasil jika kunci benar-benar dimulai dengan prefix
        if (key.startsWith(prefix)) {
          results.push({ key, value: val });
        }
      }
      return results;
    } catch (error) {
      throw error;
    }
  }
  async batch(arr: any[]): Promise<any[]> {
    if (!Array.isArray(arr)) {
      throw new Error("not array");
    }

    // Menyederhanakan logika batchList
    const batchList: Array<
      { type: "put"; key: string; value: any } | { type: "del"; key: string }
    > = [];

    arr.forEach((item) => {
      // Memastikan item memiliki properti yang diperlukan
      if (item.type === "put" && item.key && "value" in item) {
        batchList.push({
          type: "put" as const,
          key: item.key,
          value: item.value,
        });
      } else if (item.type === "del" && item.key) {
        batchList.push({
          type: "del" as const,
          key: item.key,
        });
      }
    });

    if (batchList.length === 0) {
      throw new Error("array Member format error");
    }

    await this.db.batch(batchList);
    return batchList;
  }
}

export { LevelDb };
