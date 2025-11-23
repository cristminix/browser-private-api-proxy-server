import * as fs from "fs"

export async function updateTmpChat(chatHistoryDir: string, config: any) {
  const { tmpChatId, chatId } = config
  const oldChatHistoryJsonPath = `${chatHistoryDir}/${tmpChatId}.json`
  const chatHistoryJsonPath = `${chatHistoryDir}/${chatId}.json`

  // Rename file from oldChatHistoryJsonPath to chatHistoryJsonPath
  try {
    if (fs.existsSync(oldChatHistoryJsonPath)) {
      fs.renameSync(oldChatHistoryJsonPath, chatHistoryJsonPath)
      return true
    }
  } catch (error) {}
  if (fs.existsSync(chatHistoryJsonPath)) {
    return true
  }

  return false
}
