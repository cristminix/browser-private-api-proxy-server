import * as readline from "readline"
import { marked } from "marked"

import { markedTerminal } from "marked-terminal"
import { ChatSession } from "../../global/classes/ChatSession"
import cuid from "cuid"
import { makeStreamCompletion } from "../../providers/deepseek/makeStreamCompletion"
import { sendChatFinal } from "./sendChatFInal"
import { loadJsonFile } from "../../global/fn/loadJsonFile"
import { DeepSeekChatPayload } from "../../providers/deepseek/types"
import { loadChatHistory } from "./chat-history/loadChatHistory"
import { transformMessages } from "src/providers/deepseek/transformRequestMessages"
import { getUserMessages } from "./chat-history/getUserMessages"
import { getSystemMessages } from "./chat-history/getSystemMessages"
import { generateUserPrompt } from "./chat-history/generateUserPrompt"
import { saveJsonFile } from "../../global/fn/saveJsonFile"

async function beforeSendCallback(config: any, messages: any[]) {
  const chatHistoryDir = "src/examples/chat-history"
  const { chatId } = config
  let history = await loadChatHistory(chatHistoryDir, chatId)
  let transformedMessages = transformMessages(messages)
  let userMessages = getUserMessages(transformedMessages, history)
  let systemMessages = getSystemMessages(transformedMessages, history)
  let userPrompt = generateUserPrompt(systemMessages, userMessages)
  // console.log({ messages, transformedMessages, userMessages, systemMessages, userPrompt })

  return {
    chatId,
    userPrompt,
  }
}
async function main() {
  marked.use(markedTerminal())
  // console.log(chatList)
  // return
  if (true) {
    const chatSession = await ChatSession.getInstance(cuid())

    const systemMsg = `Jawab dengan bahasa gaul dan santai.`

    const chatHistoryFile = "chat-history.json"
    saveJsonFile(chatHistoryFile, [])

    let history = await loadJsonFile(chatHistoryFile)

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    let lastMessageDisplayed = false
    const config = {
      chatId: cuid(),
    }
    while (true) {
      // if (!lastMessageDisplayed) {
      //   const lastAssistantMessage = history.filter(
      //     (m) => m.role === "assistant"
      //   )
      //   if (lastAssistantMessage.length > 0) {
      //     console.log(
      //       marked(
      //         `\n Last Message:\n${lastAssistantMessage[lastAssistantMessage.length - 1].content}`
      //       )
      //     )
      //   }
      //   lastMessageDisplayed = true
      // }
      const currentQuery = await new Promise<string>((resolve) => {
        rl.question("You: ", (input) => {
          resolve(input)
        })
      })

      if (currentQuery.toLowerCase() === "exit") {
        console.log("Goodbye!")
        break
      }

      // const xmlPayload = createContextualUserMessage(
      //   systemMsg,
      //   history,
      //   currentQuery
      // )
      // console.log(xmlPayload)
      // const prompt = xmlPayload.replace('<?xml version="1.0"?>', "")
      // const spinner = ora(`Talking to KIMI`).start()
      let outputBuffer_content = ""

      const outputBuffer = {
        continueStreamBuffer: false,
        streamBuffer: "",
        processStreamBuffer: false,
        onSaveChat: (chat) => {
          if (chat.id && chat.createTime) {
            // console.log("saveChat", { chat })
            chatSession?.setChatId(chat.id)
          }
        },
        onSaveUserMessage: (message) => {
          // chatSession?.updateLastUserMessage(message.id, message.parentId)
          // console.log("saveMessage", { message })
        },
        onSaveAssistantMessage: (message) => {
          if (message.content.length === 0) message.content = outputBuffer_content
          chatSession?.insertAssistantMessage(message.content, message.id)
        },
      }

      const chatResponse = await sendChatFinal([{ role: "system", content: systemMsg }, ...history, { role: "user", content: currentQuery }], beforeSendCallback, config)
      if (!chatResponse) {
        return
      }
      // spinner.stop()
      if (chatResponse.ok) {
        // console.log(chatResponse)
        const chunks = makeStreamCompletion(chatResponse)
        // Define type for the expected chunk structure
        interface StreamChunk {
          choices?: Array<{
            delta: {
              content: string
            }
          }>
        }

        for await (const chunk of chunks) {
          // console.log(chunk)
          if (chunk) {
            // Type guard to check if chunk is the expected object type (not Uint8Array)
            if (!(chunk instanceof Uint8Array) && typeof chunk === "object" && "choices" in chunk) {
              const typedChunk = chunk as StreamChunk
              if (typedChunk.choices && Array.isArray(typedChunk.choices) && typedChunk.choices.length > 0) {
                const bufferChunk = typedChunk.choices[0].delta.content
                if (bufferChunk) {
                  outputBuffer_content += bufferChunk
                  process.stdout.write(bufferChunk)
                }
              }
            }
          }
        }

        history.push({
          role: "user",
          content: currentQuery,
        })

        history.push({
          role: "assistant",
          content: outputBuffer_content,
        })

        saveJsonFile(chatHistoryFile, history)

        console.log(``)
      }
    }

    rl.close()
  }
}
main().catch((e) => {
  console.error(e)
})
