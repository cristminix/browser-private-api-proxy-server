import { transformMessages } from "./transformRequestMessages"
import { buildStreamChunk } from "../../openai/buildStreamChunk"
import fs from "fs"
import cuid from "cuid"
import { ChatAnswerHandler } from "../../global/classes/ChatAnswerHandler"
import { setSocketBusy, unsetSocketBusy } from "../../db/msocket"
import { Server as SocketIOServer } from "socket.io"
import { emitDeepSeekSocket } from "./emitDeepSeekSocket"
import { loadChatHistory } from "./chat-history/loadChatHistory"
import { getUserMessages } from "./chat-history/getUserMessages"
import { getSystemMessages } from "./chat-history/getSystemMessages"
import { generateUserPrompt } from "./chat-history/generateUserPrompt"
import { saveChatHistory } from "./chat-history/saveChatHistory"
import { emitSocket } from "../../global/fn/emitSocket"
import { updateTmpChat } from "./chat-history/updateTmpChat"
import { kvstore } from "../../db/store"
import { saveJsonFile } from "src/global/fn/saveJsonFile"

class DeepsSeekClient {
  baseUrl = "https://chat.deepseek.com"
  io: SocketIOServer
  chatHandler: ChatAnswerHandler
  config: any = {
    chatId: null,
    tmpChatId: cuid(),
    firstTime: true,
  }
  lastInputMessages: any[] = []

  constructor(io: any, chatHandler: any) {
    this.io = io
    this.chatHandler = chatHandler
  }
  async getCurrentChatId() {
    const requestId = cuid()
    const socket = await emitSocket(
      this.io,
      "deepseek-proxy",
      "get-current-chat",
      {
        payload: {},
        requestId,
      }
    )
    if (socket) {
      console.log(socket.id)
      // await setSocketBusy(socket.id)

      const data = await this.chatHandler.waitForAnswerKey("return-chat-id")
      // await unsetSocketBusy(socket.id)
      console.log({ data })
      if (data) {
        await kvstore.delete("use_chat_id")
        return data.chatId
      }
    }
    return await kvstore.get("use_chat_id")
  }
  async beforeSendCallback(config: any, messages: any[]) {
    const chatHistoryDir = "src/examples/chat-history"
    const { chatId, tmpChatId, firstTime } = config

    // Gunakan tmpChatId jika chatId null untuk menghindari pembacaan file null.json
    const fileId = chatId && !firstTime ? chatId : tmpChatId
    let history = await loadChatHistory(chatHistoryDir, fileId)
    let transformedMessages = transformMessages(messages)
    let userMessages = getUserMessages(transformedMessages, history)
    let systemMessages = getSystemMessages(transformedMessages, history)
    let userPrompt = generateUserPrompt(systemMessages, userMessages)
    // console.log({
    //   messages,
    //   transformedMessages,
    //   userMessages,
    //   systemMessages,
    //   userPrompt,
    // })
    this.lastInputMessages = transformedMessages
    console.log({ config })
    return {
      chatId,
      userPrompt,
    }
  }
  async afterSendCallback(assistantMessage: any) {
    const chatHistoryDir = "src/examples/chat-history"
    const { chatId, firstTime, tmpChatId } = this.config
    const history = [...this.lastInputMessages, assistantMessage]

    // Gunakan tmpChatId jika chatId null untuk menghindari penulisan file null.json
    const fileId = chatId && !firstTime ? chatId : tmpChatId
    await saveChatHistory(chatHistoryDir, fileId, history)
    return history
  }
  async generateTmpChatId() {
    const key = "deepseek_tmp_chat_id"
    const timestampKey = "deepseek_tmp_chat_id_tstamp"
    let lastChatId = await kvstore.get(key)
    let lastChatIdTimestamp = await kvstore.get(timestampKey)
    const createNew = async () => {
      const newLastChatId = cuid()
      await kvstore.put(key, newLastChatId)
      const currentDate = new Date()
      await kvstore.put(timestampKey, currentDate.getTime())
      return newLastChatId
    }
    if (!lastChatId) {
      lastChatId = await createNew()
    } else {
      const currentDate = new Date()

      if (currentDate.getTime() - lastChatIdTimestamp > 2 * 60) {
        lastChatId = await createNew()
      }
    }
    return lastChatId
  }
  async unsetTempChatId() {
    const key = "deepseek_tmp_chat_id"
    const timestampKey = "deepseek_tmp_chat_id_tstamp"
    await kvstore.delete(key)
    await kvstore.delete(timestampKey)
  }
  async fetchWithBrowserProxy(
    messages: any,
    realModel: string,
    thinking: boolean
  ) {
    const tmpChatId = await this.generateTmpChatId()
    console.log({ tmpChatId })
    this.config = {
      chatId: null,
      tmpChatId,
      firstTime: true,
    }
    if (this.config.chatId) {
      this.config.firstTime = false
    }
    if (!this.config.chatId) {
      const chatHistoryDir = "src/examples/chat-history"

      this.config.chatId = await this.getCurrentChatId()
      this.config.firstTime = false
      const status = await updateTmpChat(chatHistoryDir, this.config)
      if (status) {
        await this.unsetTempChatId()
      }
    }
    const { userPrompt: prompt } = await this.beforeSendCallback(
      this.config,
      messages
    )

    let data: any = { success: false }
    // console.log({ messages, prompt })
    // return
    const requestId = cuid()
    const socket = await emitDeepSeekSocket(this.io, "chat", {
      payload: { prompt },
      requestId,
    })
    if (socket) {
      console.log(socket.id)
      await setSocketBusy(socket.id)
      data = await this.chatHandler.waitForAnswer(socket.id, requestId)
      await unsetSocketBusy(socket.id)
    }
    let jsonBody: any = {}
    // console.log(data.phase)
    if (data.phase === "FETCH") {
      console.log("--Sending request to deepseek--")
      let { url, body, headers } = data
      // console.log({ url, body, headers })
      if (body) {
        jsonBody = JSON.parse(body)
        // jsonBody.features.enable_thinking = false
        // jsonBody.features.auto_web_search = true
        // jsonBody.features.web_search = false
        /**
       web_search: false,
    auto_web_search: false,
       *
      */
        // console.log(jsonBody)
        // jsonBody.messages = transformedMessages //[{ role: "system", content: "Jawab singkat saja" }, ...jsonBody.messages]
        if (jsonBody.chat_session_id) {
          await kvstore.put("use_chat_id", jsonBody.chat_session_id)
        }
        body = JSON.stringify(jsonBody)
      }
      const response = await fetch(`${this.baseUrl}${url}`, {
        method: "POST",
        headers: { ...headers },
        body,
      })
      const ENABLE_RELOAD =
        process.env.DEEPSEEK_ENABLE_RELOAD_AFTER_COMPLETIONS ?? "false"
      console.log({ ENABLE_RELOAD })
      if (ENABLE_RELOAD === "true") {
        await emitSocket(this.io, "deepseek-proxy", "chat-reload", {
          chatId: jsonBody.chat_session_id,
          requestId: cuid(),
        })
      }
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
          direct = false,
          chatBuffer: any = { content: "" }
        ) => {
          let { model: requstModel, ...options } = params

          const defaultModel = "deepseek-chat"

          // const transformedMessages = transformMessages(options.messages)

          const realModel = defaultModel
          // console.log({ realModel, endpoint, signature })
          // return
          const thinking = false
          const response = await this.fetchWithBrowserProxy(
            options.messages,
            realModel,
            thinking
          )

          // await makeStreamCompletion(response, true, realModel, "", [])

          // Check if response is valid before proceeding
          if (!response) {
            throw new Error("Failed to get response from API")
          }

          if (params.stream) {
            return this.makeStreamCompletion(
              response,
              direct,
              realModel,
              chatBuffer
            )
          }
          return this._sendResponseFromStream(
            this.makeStreamCompletion(response, false, realModel, chatBuffer)
          )
        },
      },
    }
  }
  checkUsage(jsonData: any) {
    /*
    example valid jsonData
    {
    "v": [
      {
        "v": "FINISHED",
        "p": "status"
      },
      {
        "v": 25503,
        "p": "accumulated_token_usage"
      }
    ],
    "p": "response",
    "o": "BATCH"
  }
    */

    // Check and get value of v for accumulated_token_usage
    if (jsonData && Array.isArray(jsonData.v)) {
      for (const item of jsonData.v) {
        if (item.p === "accumulated_token_usage" && item.v !== undefined) {
          return {
            accumulated_token_usage: item.v,
          }
        }
      }
    }
    return null
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
  async *makeStreamCompletion(
    response: Response,
    sso = false,
    model: string,
    chatBuffer: any
  ) {
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
    // let responseLines: any[] = []
    try {
      // Process the stream until completion
      let streamCompleted = false
      while (!streamCompleted) {
        const { done, value } = await reader.read()

        // Handle stream completion
        if (done) {
          // Send final event if in SSO mode
          console.log({ sso, calculatedUsage })
          const totalTokens = promptTokens + completionTokens

          let usage = {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: totalTokens,
          }
          if (calculatedUsage) {
            const { accumulated_token_usage } = calculatedUsage
            usage = {
              prompt_tokens: accumulated_token_usage,
              completion_tokens: 0,
              total_tokens: accumulated_token_usage,
            }
          }
          const finalChunk = buildStreamChunk({
            model,
            index: completionId,
            finishReason: "done",
            content: "",
            usage,
            done: true,
          })
          if (sso) {
            yield encoder.encode(
              `data: ${JSON.stringify(finalChunk)}\n\ndata: [DONE]\n\n`
            )
          } else {
            yield finalChunk
          }
          streamCompleted = true
          // saveJsonFile(`response-${cuid()}.json`, responseLines)
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
              // responseLines.push(jsonData)
              // if (jsonData.type === "chat:completion") {
              //   const { data } = jsonData
              //   const { done: done2, delta_content, usage, error } = data
              //   if (error) {
              //     // console.log(error)
              //   }
              //   if (done2) {
              //     streamCompleted = true
              //   }
              //   if (usage) {
              //     calculatedUsage = usage
              //     // console.log(usage)
              //   }
              // console.log(jsonData)
              const usageData = this.checkUsage(jsonData)
              if (
                usageData &&
                usageData.accumulated_token_usage !== undefined
              ) {
                calculatedUsage = usageData
              }
              const result = this.convertToOpenaiTextStream(
                jsonData,
                model,
                completionId,
                {}
              )
              if (result) {
                // console.log(result)
                if (chatBuffer) {
                  const typedChunk = result
                  if (
                    typedChunk.choices &&
                    Array.isArray(typedChunk.choices) &&
                    typedChunk.choices.length > 0
                  ) {
                    const bufferChunk = typedChunk.choices[0].delta.content
                    if (bufferChunk) {
                      chatBuffer.content += bufferChunk
                    }
                  }
                }
                if (sso) {
                  yield encoder.encode(`data: ${JSON.stringify(result)}\n\n`)
                } else {
                  yield result
                }
                // console.log(`data: ${JSON.stringify(result)}\n\n`)

                // Only increment completion ID if not a completion end event
                // if (done2) {
                //   completionId++
                // }
              }
              // }
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
    report: any = {}
  ) {
    const { v: inputData } = jsonData
    let content = ""
    let done = false

    if (typeof inputData === "string") {
      content = inputData
    } else if (Array.isArray(inputData)) {
      // let i = 0
      for (const item of inputData) {
        const { v: nextData, p, o } = item
        // console.log("here-a", i, item)
        // i += 1
        if (nextData) {
          // console.log("here-0", p)

          if (typeof nextData === "string" || typeof nextData === "number") {
            if (o) {
              if (o === "APPEND") {
                content = String(nextData)
              }
            }
          } else if (Array.isArray(nextData)) {
            for (const subItem of nextData) {
              const { type, content: text } = subItem
              if (text && type === "RESPONSE") {
                content = text
              } else {
                // console.log("here-xxx")
              }
            }
          }
        }
      }
    }
    if (typeof inputData === "object") {
      const { response } = inputData
      if (response) {
      }
    }
    // const { done, delta_content: text, edit_content: textEdit } = inputData

    if (content) {
      return buildStreamChunk({
        model,
        index: completionId,
        finishReason: done ? "finish" : null,
        content,
      })
    }

    return null
  }

  ensureDir(dirPath: string) {
    // Create directory if it doesn't exist, with recursive option
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export default DeepsSeekClient
