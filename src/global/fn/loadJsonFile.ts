import * as fs from "fs"
import * as path from "path"
// import { ChatHistoryEntry } from "../classes/ChatHistoryEntry"

/**
 * Loads chat history from a JSON file
 * @param path - The name of the JSON file to load
 * @returns The parsed chat history array
 */
export async function loadJsonFile(path: string) {
  // const filePath = path.join(__dirname, filename)
  const fileContent = fs.readFileSync(path, "utf-8")
  return JSON.parse(fileContent)
}
