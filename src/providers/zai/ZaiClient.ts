import { transformMessages } from "./transformRequestMessages"
import { getLastUserMessageContent } from "./getLastUserMessageContent"
import { buildStreamChunk } from "../../openai/buildStreamChunk"
import fs from "fs"
import cuid from "cuid"
import { ChatAnswerHandler } from "../../global/classes/ChatAnswerHandler"
import { emitZaiSocket } from "./emitZaiSocket"
import { setSocketBusy, unsetSocketBusy } from "../../db/msocket"
import { Server as SocketIOServer } from "socket.io"

class ZAIClient {
  baseUrl = "https://chat.z.ai"
  io: SocketIOServer
  chatHandler: ChatAnswerHandler

  constructor(io: any, chatHandler: any) {
    this.io = io
    this.chatHandler = chatHandler
  }
  async fetchWithBrowserProxy(
    userPrompt: string,
    realModel: string,
    transformedMessages: any,
    thinking: boolean
  ) {
    const prompt = userPrompt
    let data: any = { success: false }
    const requestId = cuid()
    const socket = await emitZaiSocket(this.io, "chat", {
      payload: { prompt },
      requestId,
    })
    if (socket) {
      console.log(socket.id)
      await setSocketBusy(socket.id)
      data = await this.chatHandler.waitForAnswer(socket.id, requestId)
      await unsetSocketBusy(socket.id)
    }
    // console.log(data.phase)
    if (data.phase === "FETCH") {
      console.log("--Sending request to z.ai")
      let { url, body, headers } = data
      // console.log({ url, body, headers })
      if (body) {
        const jsonBody = JSON.parse(body)
        jsonBody.features.enable_thinking = false
        // jsonBody.features.auto_web_search = true
        jsonBody.features.web_search = false
        /**
       web_search: false,
    auto_web_search: false,
       * 
      */
        // console.log(jsonBody)
        jsonBody.messages = transformedMessages //[{ role: "system", content: "Jawab singkat saja" }, ...jsonBody.messages]
        body = JSON.stringify(jsonBody)
      }
      const response = await fetch(`https://chat.z.ai${url}`, {
        method: "POST",
        headers: { ...headers },
        body,
      })
      return response
    }
    return null
  }
  get chat() {
    return {
      completions: {
        create: async (
          params: any,
          requestOption: any = {},
          direct = false
        ) => {
          let { model: requstModel, ...options } = params

          const defaultModel = "glm-4.6"

          const transformedMessages = transformMessages(options.messages)

          const userPrompt = getLastUserMessageContent(
            transformedMessages
          ) as string

          const realModel = defaultModel
          // console.log({ realModel, endpoint, signature })
          // return
          const thinking = false
          const response = await this.fetchWithBrowserProxy(
            userPrompt,
            realModel,
            transformedMessages,
            thinking
          )

          // await makeStreamCompletion(response, true, realModel, "", [])

          // Check if response is valid before proceeding
          if (!response) {
            throw new Error("Failed to get response from API")
          }

          if (params.stream) {
            return this.makeStreamCompletion(response, direct, realModel)
          }
          return this._sendResponseFromStream(
            this.makeStreamCompletion(response, false, realModel)
          )
        },
      },
    }
  }
  async _sendResponseFromStream(input: any) {
    // const reader = response.body.getReader()
    let content = ""
    let chatResponse: any = {
      choices: [
        {
          message: {
            role: "assistant",
            content: "",
          },
        },
      ],
    }
    for await (const chunk of input) {
      // console.log(chunk.toString())
      // dataPtr = chunk
      content += chunk.choices[0].delta.content
      // console.log({ content })

      if (chunk.usage) {
        chatResponse.usage = chunk.usage
      }
    }
    chatResponse.choices[0].message.content = content
    // console.log(dataPtr)

    return chatResponse
  }
  async *makeStreamCompletion(response: Response, sso = false, model: string) {
    // Validate response with more detailed error message
    if (!response.ok) {
      throw new Error(
        `API request failed with status ${
          response.status
        } and message: ${await response.text()}`
      )
    }

    // Check if response body exists
    if (!response.body) {
      throw new Error("Streaming not supported in this environment")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const encoder = new TextEncoder()
    const promptTokens = 0
    let completionTokens = 0
    let calculatedUsage: any = null

    let buffer = ""
    let completionId = 1

    try {
      // Process the stream until completion
      let streamCompleted = false
      while (!streamCompleted) {
        const { done, value } = await reader.read()

        // Handle stream completion
        if (done) {
          // Send final event if in SSO mode
          if (sso) {
            const totalTokens = promptTokens + completionTokens
            let usage = {
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              total_tokens: totalTokens,
            }
            if (calculatedUsage) {
              usage = calculatedUsage
            }
            const finalChunk = buildStreamChunk({
              model,
              index: completionId,
              finishReason: "done",
              content: "",
              usage,
              done: true,
            })
            yield encoder.encode(
              `data: ${JSON.stringify(finalChunk)}\n\ndata: [DONE]\n\n`
            )
          }
          streamCompleted = true
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })

        // Split buffer by newlines and process each part
        const lines = buffer.split("\n")

        // Keep the last incomplete part in buffer
        buffer = lines.pop() || ""

        // Process each complete line
        for (const line of lines) {
          // Skip empty lines or DONE markers
          if (!line.trim() || line === "data: [DONE]") {
            continue
          }

          try {
            // Process only data lines
            if (line.startsWith("data: ")) {
              // console.log(line)
              // Extract JSON string after "data: "
              const jsonString = line.slice(6)
              // console.log(jsonString)

              // Validate that we have JSON content
              if (!jsonString) {
                continue
              }

              const jsonData = JSON.parse(jsonString)

              if (jsonData.type === "chat:completion") {
                const { data } = jsonData
                const { done: done2, delta_content, usage, error } = data
                if (error) {
                  // console.log(error)
                }
                if (done2) {
                  streamCompleted = true
                }
                if (usage) {
                  calculatedUsage = usage
                  // console.log(usage)
                }
                // console.log(jsonData)
                const result = this.convertToOpenaiTextStream(
                  jsonData,
                  model,
                  completionId,
                  calculatedUsage
                )
                if (result) {
                  // console.log(result)

                  if (sso) {
                    yield encoder.encode(`data: ${JSON.stringify(result)}\n\n`)
                  } else {
                    yield result
                  }
                  // console.log(`data: ${JSON.stringify(result)}\n\n`)

                  // Only increment completion ID if not a completion end event
                  if (done2) {
                    completionId++
                  }
                }
              }
            }
          } catch (err) {
            // Log parsing errors but continue processing
            // console.error("Error parsing chunk:", line, err)

            // For robustness, we could also emit an error event in SSO mode
            if (sso) {
            }
          }
        }
      }
    } finally {
      // Ensure reader is released even if an error occurs
      reader.releaseLock()
    }
  }

  convertToOpenaiTextStream(
    jsonData: any,
    model: string,
    completionId: number,
    usage: any = null
  ) {
    const { data: inputData } = jsonData
    const { done, delta_content: text, edit_content: textEdit } = inputData
    const content = text ? text : textEdit
    if (content) {
      return buildStreamChunk({
        model,
        index: completionId,
        finishReason: done ? "finish" : null,
        content,
        usage,
      })
    }

    return null
  }

  ensureDir(dirPath: string) {
    // Create directory if it doesn't exist, with recursive option
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export default ZAIClient
