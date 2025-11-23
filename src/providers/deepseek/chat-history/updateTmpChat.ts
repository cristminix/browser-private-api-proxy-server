import * as fs from "fs"

export async function updateTmpChat(chatHistoryDir: string, config: any) {
  const { tmpChatId, chatId } = config
  const oldChatHistoryJsonPath = `${chatHistoryDir}/${tmpChatId}.json`
  const chatHistoryJsonPath = `${chatHistoryDir}/${chatId}.json`

  // Rename file from oldChatHistoryJsonPath to chatHistoryJsonPath
  fs.renameSync(oldChatHistoryJsonPath, chatHistoryJsonPath)
}
