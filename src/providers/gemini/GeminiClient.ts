import { transformMessages } from "../deepseek/transformRequestMessages"
import { buildStreamChunk } from "../../openai/buildStreamChunk"
import fs from "fs"
import cuid from "cuid"
import { ChatAnswerHandler } from "../../global/classes/ChatAnswerHandler"
import { setSocketBusy, unsetSocketBusy } from "../../db/msocket"
import { Server as SocketIOServer } from "socket.io"
import { loadChatHistory } from "../deepseek/chat-history/loadChatHistory"
import { getUserMessages } from "../deepseek/chat-history/getUserMessages"
import { getSystemMessages } from "./getSystemMessages"
import { generateUserPrompt } from "../deepseek/chat-history/generateUserPrompt"
import { saveChatHistory } from "../deepseek/chat-history/saveChatHistory"
import { emitSocket } from "../../global/fn/emitSocket"
import { updateTmpChat } from "../deepseek/chat-history/updateTmpChat"
import { kvstore } from "../../db/store"
import { saveJsonFile } from "../../global/fn/saveJsonFile"
import { emitGeminiSocket } from "./emitGeminiSocket"
import { parseResponseBody } from "./parseResponseBody"
import unescapeJs from "unescape-js"
import { cleanInvalidMarkdownCodeBlocks } from "./cleanInvalidMarkdownCodeBlocks"
class GeminiClient {
  baseUrl = "https://gemini.google.com"
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
    const socket = await emitSocket(this.io, "gemini-proxy", "get-current-chat", {
      payload: {},
      requestId,
    })
    if (socket) {
      console.log(socket.id)
      // await setSocketBusy(socket.id)
      try {
        const data = await this.chatHandler.waitForAnswerKey("return-chat-id")
        // await unsetSocketBusy(socket.id)
        console.log({ data })
        if (data) {
          await kvstore.delete("use_chat_id")
          return data.chatId
        }
      } catch (error) {}
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
    let systemMessages = await getSystemMessages(transformedMessages, history)
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

  async *getAnswer(
    requestId: string,
    bufferLines: any[],
    config: any = {
      streamDone: false,
      completionId: 0,
      lastContent: "",
      fullContent: "",
      partialContent: "",
    }
  ) {
    function cleanContent(input) {
      return input.replace("\\*", "*").replace("\\*", "*").replace("\\`", "`").replace("\\.", ".")
    }
    while (!config.streamDone) {
      // `answer_stream_${requestId}`
      const answer = await this.chatHandler.waitForAnswerKey(`answer_stream_${requestId}`)
      // console.log(answer)
      const line = answer.content
      bufferLines.push(line)
      // for (const line of lines) {
      if (!line.trim()) {
        continue
      }
      const buffer = line.trim()
      if (buffer.includes("[DONE]")) {
        console.log("STREAM_DONE")
        config.streamDone = true
        saveJsonFile(`src/providers/gemini/responses/response-${requestId}.json`, bufferLines)
      }
      let content = cleanContent(parseResponseBody(line))
      if (config.streamDone) {
        content = config.fullContent
      }
      if (content && content.trim() !== "") {
        // Clean invalid markdown code blocks from content using the dedicated function
        const cleanedContent = cleanInvalidMarkdownCodeBlocks(content, {
          finish_reason: config.streamDone ? "done" : null,
        })
        config.fullContent = content

        // Since each chunk contains the full content, we need to extract only the new part
        if (cleanedContent.length > config.lastContent.length) {
          config.partialContent = cleanedContent.substr(config.lastContent.length, cleanedContent.length - config.lastContent.length)

          const chunkData = {
            content: config.partialContent,
            index: config.completionId++,
            model: "gemini",
          }
          yield buildStreamChunk(chunkData)
        } else if (config.lastContent === "") {
          config.partialContent = cleanedContent

          config.fullContent = cleanedContent

          const chunkData = {
            content: config.partialContent,
            index: config.completionId++,
            model: "gemini",
          }
          yield buildStreamChunk(chunkData)
        }
        config.lastContent = cleanedContent
      }
    }
    // }
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
    const key = "gemini_tmp_chat_id"
    const timestampKey = "gemini_tmp_chat_id_tstamp"
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
    const key = "gemini_tmp_chat_id"
    const timestampKey = "gemini_tmp_chat_id_tstamp"
    await kvstore.delete(key)
    await kvstore.delete(timestampKey)
  }
  async *fetchWithBrowserProxy(messages: any, realModel: string, thinking: boolean, chatBuffer: any) {
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
    const { userPrompt: prompt } = await this.beforeSendCallback(this.config, messages)

    let data: any = { success: false }
    console.log({ messages, prompt })
    // return
    const requestId = cuid()
    const socket = await emitGeminiSocket(this.io, "chat", {
      payload: { prompt },
      requestId,
    })
    if (socket) {
      console.log(socket.id)
      // await setSocketBusy(socket.id)

      // data = await chatHandlerAnswer.waitForAnswerKey(`answer_stream_${requestId}`)
      // await unsetSocketBusy(socket.id)
      const bufferLines: any[] = []
      let assistantMessage = ""
      function cleanContent(input) {
        return input.replace("\\*", "*").replace("\\*", "*").replace("\\`", "`").replace("\\.", ".")
      }
      async function* getAnswer(self) {
        let streamDone = false
        let completionId = 0
        let lastContent = ""
        let fullContent = "" // Track the full accumulated content
        let partialContent = ""
        while (!streamDone) {
          // `answer_stream_${requestId}`
          const answer = await self.chatHandler.waitForAnswerKey(`answer_stream_${requestId}`)
          // console.log(answer)
          const line = answer.content
          bufferLines.push(line)
          // for (const line of lines) {
          if (!line.trim()) {
            continue
          }
          const buffer = line.trim()
          if (buffer.includes("[DONE]")) {
            console.log("STREAM_DONE")
            streamDone = true
            saveJsonFile(`src/providers/gemini/responses/response-${requestId}.json`, bufferLines)
          }
          let content = cleanContent(parseResponseBody(line))
          if (streamDone) {
            content = fullContent
          }
          if (content && content.trim() !== "") {
            // Clean invalid markdown code blocks from content using the dedicated function
            const cleanedContent = cleanInvalidMarkdownCodeBlocks(content, {
              finish_reason: streamDone ? "done" : null,
            })
            fullContent = content

            // Since each chunk contains the full content, we need to extract only the new part
            if (cleanedContent.length > lastContent.length) {
              partialContent = cleanedContent.substr(lastContent.length, cleanedContent.length - lastContent.length)
              chatBuffer.content += partialContent

              const chunkData = {
                content: partialContent,
                index: completionId++,
                model: "gemini",
              }
              yield buildStreamChunk(chunkData)
            } else if (lastContent === "") {
              partialContent = cleanedContent

              fullContent = cleanedContent
              chatBuffer.content += partialContent
              const chunkData = {
                content: partialContent,
                index: completionId++,
                model: "gemini",
              }
              yield buildStreamChunk(chunkData)
            }
            lastContent = cleanedContent
          }
        }
        // }
      }
      yield* getAnswer(this)
    }

    // return null
  }
  get chat() {
    return {
      completions: {
        create: async (params: any, requestOption: any = {}, direct = false, chatBuffer: any = { content: "" }) => {
          let { model: requstModel, ...options } = params

          const defaultModel = "gemini"

          // const transformedMessages = transformMessages(options.messages)

          const realModel = defaultModel
          // console.log({ realModel, endpoint, signature })
          // return
          const thinking = false

          // await makeStreamCompletion(response, true, realModel, "", [])

          // Check if response is valid before proceeding

          if (params.stream) {
            return this.fetchWithBrowserProxy(options.messages, realModel, thinking, chatBuffer)
          }
          return this._sendResponseFromStream(this.fetchWithBrowserProxy(options.messages, realModel, thinking, chatBuffer))
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

  ensureDir(dirPath: string) {
    // Create directory if it doesn't exist, with recursive option
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export default GeminiClient
