import * as fs from "fs"

export const saveChatHistory = async (chatHistoryDir: string, chatId: string, data: any[]) => {
  const chatHistoryJsonPath = `${chatHistoryDir}/${chatId}.json`

  // 1. Check if chatHistoryDir exists, if not create directory
  if (!fs.existsSync(chatHistoryDir)) {
    fs.mkdirSync(chatHistoryDir, { recursive: true })
  }
  //2.write data to file
  fs.writeFileSync(chatHistoryJsonPath, JSON.stringify(data, null, 2))

  return data
}
