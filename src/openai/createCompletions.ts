import { ChatCompletionRequest } from "./types/chat"
import ZaiProvider from "../providers/zai/ZaiProvider"
import DeepsSeekProvider from "../providers/deepseek/DeepsSeekProvider"
async function createCompletions(
  chatRequest: ChatCompletionRequest,
  io: any,
  chatHandler: any
) {
  let requestModel = chatRequest.model
  let providerApi
  if (requestModel === "zai") {
    providerApi = new ZaiProvider(io, chatHandler)
  } else if (requestModel === "deepseek") {
    providerApi = new DeepsSeekProvider(io, chatHandler)
  }
  //@ts-ignore
  // const messages = await getChatRequestMessages(chatRequest, providerApi)
  const streaming = chatRequest.stream
  console.log({ streaming })
  //@ts-ignore
  let realModel = requestModel

  console.log("realModel", realModel)
  //@ts-ignore
  return streaming
    ? providerApi.stream(chatRequest)
    : providerApi.create(chatRequest)
}

export default createCompletions
