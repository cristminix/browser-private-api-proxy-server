export function getSystemMessages(messages: any[], history: any[]) {
  //   const systemMessages = messages.filter((m) => m.role === "system")
  let systemMessages: any[] = []
  if (Array.isArray(history)) {
    if (history.length > 0) {
      systemMessages = []
      return systemMessages
    }
  }

  // Find the last assistant message index

  systemMessages = messages.filter((m) => m.role === "system")
  return systemMessages
}
