import * as fs from "fs"

export const loadChatHistory = async (chatHistoryDir: string, chatId: string) => {
  const chatHistoryJsonPath = `${chatHistoryDir}/${chatId}.json`

  // 1. Check if chatHistoryDir exists, if not create directory
  if (!fs.existsSync(chatHistoryDir)) {
    fs.mkdirSync(chatHistoryDir, { recursive: true })
  }

  // 2. Load json file from chatHistoryJsonPath
  // 3. If not exist create empty object
  let chatHistory = []
  if (fs.existsSync(chatHistoryJsonPath)) {
    const fileContent = fs.readFileSync(chatHistoryJsonPath, "utf-8")
    chatHistory = JSON.parse(fileContent)
  }

  // 4. Return object from json file
  return chatHistory
}
