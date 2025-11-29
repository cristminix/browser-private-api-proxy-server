import { ChatCompletionRequest, ChatResponse, ChatResponseStream } from "../../openai/types/chat"
import GeminiClient from "./GeminiClient"

class GeminiProvider {
  private client: GeminiClient

  constructor(io: any, chatHandler: any) {
    this.client = new GeminiClient(io, chatHandler)
  }

  public async *stream(
    request: ChatCompletionRequest
    //@ts-ignore
  ): Promise<AsyncGenerator<ChatResponseStream>> {
    // Gunakan signature 2 arg untuk memanggil streaming (sesuai implementasi HuggingFace client)
    const chatBuffer = {
      content: "",
    }
    const response: any = await this.client.chat.completions.create(
      {
        ...request,
        stream: true,
      },
      {},
      false,
      chatBuffer
    )

    // const reader = response.body.getReader()

    for await (const chunk of response) {
      // console.log(chunk)
      yield chunk
    }

    const assistantMessage = { role: "assistant", content: chatBuffer.content }
    // console.log(assistantMessage)
    await this.client.afterSendCallback(assistantMessage)
  }

  public async create(request: ChatCompletionRequest): Promise<ChatResponse> {
    const response: any = await this.client.chat.completions.create(
      {
        ...request,
        stream: false,
      },
      {},
      false
    )
    // console.log({ response })

    const assistantMessage = {
      role: "assistant",
      content: response.choices?.[0]?.message?.content || "",
    }
    await this.client.afterSendCallback(assistantMessage)

    return response
  }
}

export default GeminiProvider
