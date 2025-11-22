import * as readline from "readline"
import { marked } from "marked"

import { markedTerminal } from "marked-terminal"
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
import { saveChatHistory } from "./chat-history/saveChatHistory"

async function beforeSendCallback(config: any, messages: any[]) {
  const chatHistoryDir = "src/examples/chat-history"
  const { chatId } = config
  let history = await loadChatHistory(chatHistoryDir, chatId)
  let transformedMessages = transformMessages(messages)
  let userMessages = getUserMessages(transformedMessages, history)
  let systemMessages = getSystemMessages(transformedMessages, history)
  let userPrompt = generateUserPrompt(systemMessages, userMessages)
  console.log({ messages, transformedMessages, userMessages, systemMessages, userPrompt })

  return {
    chatId,
    userPrompt,
  }
}
async function afterSendCallback(config: any, messages: any[], assistantMessage: any) {
  const chatHistoryDir = "src/examples/chat-history"
  const { chatId } = config
  const history = [...messages, assistantMessage]
  await saveChatHistory(chatHistoryDir, chatId, history)
  return history
}
async function main() {
  marked.use(markedTerminal())
  if (true) {
    const systemMsg = `Jawab dengan bahasa gaul dan santai.`

    const chatHistoryFile = "chat-history.json"

    let history = await loadJsonFile(chatHistoryFile)

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    const config = {
      chatId: cuid(),
    }
    while (true) {
      const currentQuery = await new Promise<string>((resolve) => {
        rl.question("You: ", (input) => {
          resolve(input)
        })
      })

      if (currentQuery.toLowerCase() === "exit") {
        console.log("Goodbye!")
        break
      }

      let outputBuffer_content = ""
      let appendHistory = history.length > 0 ? history.filter((m) => m.role !== "system") : history
      let inputMessages = [{ role: "system", content: systemMsg }, ...appendHistory, { role: "user", content: currentQuery }]
      const chatResponse = await sendChatFinal(inputMessages, beforeSendCallback, config)
      if (!chatResponse) {
        return
      }
      if (chatResponse.ok) {
        const chunks = makeStreamCompletion(chatResponse)
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
        const assistantMessage = {
          role: "assistant",
          content: outputBuffer_content,
        }
        history = await afterSendCallback(config, inputMessages, assistantMessage)

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
