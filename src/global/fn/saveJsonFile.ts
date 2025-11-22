import * as fs from "fs"
import * as path from "path"
// import { ChatHistoryEntry } from "../classes/ChatHistoryEntry"

/**
 * Saves chat history to a JSON file
 * @param filename - The name of the JSON file to save
 * @param data - The chat history data to save
 */
export async function saveJsonFile(filePath: string, data: any[]) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
}
