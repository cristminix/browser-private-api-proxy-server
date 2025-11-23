import {
  ChatCompletionRequest,
  ChatResponse,
  ChatResponseStream,
} from "../../openai/types/chat"
import DeepsSeekClient from "./DeepsSeekClient"

class DeepsSeekProvider {
  private client: DeepsSeekClient

  constructor(io: any, chatHandler: any) {
    this.client = new DeepsSeekClient(io, chatHandler)
  }

  public async *stream(
    request: ChatCompletionRequest
    //@ts-ignore
  ): Promise<AsyncGenerator<ChatResponseStream>> {
    // Gunakan signature 2 arg untuk memanggil streaming (sesuai implementasi HuggingFace client)
    const response: any = await this.client.chat.completions.create(
      {
        ...request,
        stream: true,
      },
      {},
      false
    )

    // const reader = response.body.getReader()

    for await (const chunk of response) {
      // console.log(chunk)
      yield chunk
    }
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
    return response
  }
}

export default DeepsSeekProvider
