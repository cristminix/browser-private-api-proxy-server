import { ChatCompletionRequest } from "./types/chat"
function isPromptMode(chatRequest: ChatCompletionRequest) {
  return Array.isArray(chatRequest.prompt)
}
export default isPromptMode
