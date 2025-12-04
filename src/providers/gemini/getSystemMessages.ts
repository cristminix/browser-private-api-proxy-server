import { compressSystemMessage } from "./compressSystemMessage"

export async function getSystemMessages(messages: any[], history: any[]) {
  //   const systemMessages = messages.filter((m) => m.role === "system")
  const updatedSystemMessages: any[] = []

  let systemMessages: any[] = []
  if (Array.isArray(history)) {
    if (history.length > 0) {
      systemMessages = []
      return systemMessages
    }
  }

  // Find the last assistant message index

  systemMessages = messages.filter((m) => m.role === "system")

  for (const m of systemMessages) {
    let msg = m
    msg.content = await compressSystemMessage(m.content, /You are Kilo Code/)

    updatedSystemMessages.push(msg)
  }
  return updatedSystemMessages
}
