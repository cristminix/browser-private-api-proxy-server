export function generateUserPrompt(systemMessages: any[], userMessages: any[]) {
  let userPrompt = ""
  let systemPrompt = systemMessages.length > 0 ? "[System Instruction]\n\n" : ""
  for (const systemMessage of systemMessages) {
    systemPrompt += `${systemMessage.content}\n`
  }
  for (const userMessage of userMessages) {
    userPrompt += `${userMessage.content}\n`
  }
  return `${systemPrompt}${systemPrompt.length > 0 ? "\n\n" : ""}${systemPrompt.length > 0 ? "[Current User Query]\n" : ""}${userPrompt}`
}
