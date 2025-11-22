export function getUserMessages(messages: any[], history: any[]) {
  //   const systemMessages = messages.filter((m) => m.role === "system")
  let userMessages: any[] = []
  if (Array.isArray(history)) {
    if (history.length > messages.length) {
      userMessages = messages.slice(history.length)
    }
  }

  // Find the last assistant message index

  const lastAssistantIndex = messages.findLastIndex((m) => m.role === "assistant")
  if (lastAssistantIndex !== -1) {
    userMessages = messages.filter((m) => m.role !== "system").slice(lastAssistantIndex + 1)
  } else {
    userMessages = messages.filter((m) => m.role !== "system")
  }
  // console.log({ userMessages })
  return userMessages
}
