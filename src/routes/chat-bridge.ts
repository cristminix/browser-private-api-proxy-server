import { Context, Hono } from "hono"
import { ioInstance } from "../setupSocketIO"
import { ChatAnswerHandler } from "../global/classes/ChatAnswerHandler"
import { emitZaiSocket } from "../providers/zai/emitZaiSocket"
import cuid from "cuid"
import { setSocketBusy, unsetSocketBusy } from "../db/msocket"
import { emitSocket } from "../global/fn/emitSocket"
import { streamSSE } from "hono/streaming"
import { parseResponseBody } from "../providers/gemini/parseResponseBody"
import { buildStreamChunk } from "../openai/buildStreamChunk"
import { saveJsonFile } from "../global/fn/saveJsonFile"
import { cleanInvalidMarkdownCodeBlocks } from "../providers/gemini/cleanInvalidMarkdownCodeBlocks"

const app = new Hono()
app.get("/chat", async (c: Context) => {
  const prompt = c.req.query("prompt") || "What is the capital of france"
  const platform = c.req.query("platform") || "z.ai"
  let data: any = { success: false }
  const requestId = cuid()
  let appName = "zai-proxy" //? "zai-proxy" : "mistral-proxy"
  if (platform === "z.ai") {
    appName = "zai-proxy"
  } else if (platform === "mistral.ai") {
    appName = "mistral-proxy"
  } else if (platform === "deepseek") {
    appName = "deepseek-proxy"
  } else if (platform === "gemini") {
    appName = "gemini-proxy"
  }
  const socket = await emitSocket(ioInstance, appName, "chat", {
    payload: { prompt },
    requestId,
  })
  if (socket) {
    console.log(socket.id)
    await setSocketBusy(socket.id)
    const chatHandlerAnswer: ChatAnswerHandler = ChatAnswerHandler.getInstance()

    data = await chatHandlerAnswer.waitForAnswer(socket.id, requestId)
    await unsetSocketBusy(socket.id)
  }

  // console.log(data)
  return c.json(data)
})

app.get("/chat-stream", async (c: Context) => {
  const prompt = c.req.query("prompt") || "What is the capital of france"
  const platform = c.req.query("platform") || "gemini"
  let data: any = { success: false }
  const requestId = cuid()
  let appName = "zai-proxy" //? "zai-proxy" : "mistral-proxy"
  if (platform === "z.ai") {
    appName = "zai-proxy"
  } else if (platform === "mistral.ai") {
    appName = "mistral-proxy"
  } else if (platform === "deepseek") {
    appName = "deepseek-proxy"
  } else if (platform === "gemini") {
    appName = "gemini-proxy"
  }
  const socket = await emitSocket(ioInstance, appName, "chat", {
    payload: { prompt },
    requestId,
  })
  if (socket) {
    console.log(socket.id)
    // await setSocketBusy(socket.id)

    // data = await chatHandlerAnswer.waitForAnswerKey(`answer_stream_${requestId}`)
    // await unsetSocketBusy(socket.id)
    const bufferLines: any[] = []
    function cleanContent(input) {
      return input.replace("\\*", "*").replace("\\*", "*").replace("\\`", "`").replace("\\.", ".")
    }
    async function* getAnswer() {
      let streamDone = false
      let completionId = 0
      let lastContent = ""
      let fullContent = "" // Track the full accumulated content
      let partialContent = ""
      while (!streamDone) {
        // `answer_stream_${requestId}`
        const chatHandlerAnswer: ChatAnswerHandler = ChatAnswerHandler.getInstance()

        const answer = await chatHandlerAnswer.waitForAnswerKey(`answer_stream_${requestId}`)
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

            const chunkData = {
              content: partialContent,
              index: completionId++,
              model: "gemini",
            }
            yield buildStreamChunk(chunkData)
          } else if (lastContent === "") {
            partialContent = cleanedContent

            fullContent = cleanedContent

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
    return streamSSE(c, async (stream) => {
      if (platform === "gemini") {
        const chunks = getAnswer()
        for await (const item of chunks) {
          // console.log({ item })
          await stream.write(`data: ${JSON.stringify(item)}\n\n`)
        }
      }
    })
  }
  // console.log(data)
  c.header("Content-Type", "text/event-stream; charset=utf-8")
  return streamSSE(c, async (stream) => {
    if (platform === "gemini") {
    }
  })
})
app.post("/chat", async (c: Context) => {
  const body = await c.req.json()
  const prompt = body.prompt || "What is the capital of france"
  let data: any = { success: false }
  const requestId = cuid()

  const socket = await emitZaiSocket(ioInstance, "chat", {
    payload: { prompt },
    requestId,
  })
  if (socket) {
    await setSocketBusy(socket.id)

    console.log(socket.id)
    const chatHandlerAnswer: ChatAnswerHandler = ChatAnswerHandler.getInstance()

    data = await chatHandlerAnswer.waitForAnswer(socket.id, requestId)
    await unsetSocketBusy(socket.id)
  }

  // console.log(data)
  return c.json(data)
})
app.get("/get-current-chat", async (c: Context) => {
  const platform = c.req.query("platform") || "deepseek"
  let data: any = { success: false }
  const requestId = cuid()
  let appName = "zai-proxy" //? "zai-proxy" : "mistral-proxy"
  if (platform === "z.ai") {
    appName = "zai-proxy"
  } else if (platform === "mistral.ai") {
    appName = "mistral-proxy"
  } else if (platform === "deepseek") {
    appName = "deepseek-proxy"
  } else if (platform === "gemini") {
    appName = "gemini-proxy"
  }
  const socket = await emitSocket(ioInstance, appName, "get-current-chat", {
    payload: {},
    requestId,
  })
  if (socket) {
    console.log(socket.id)
    // await setSocketBusy(socket.id)
    const chatHandlerAnswer: ChatAnswerHandler = ChatAnswerHandler.getInstance()

    data = await chatHandlerAnswer.waitForAnswerKey("return-chat-id")
    // await unsetSocketBusy(socket.id)
  }

  // console.log(data)
  return c.json(data)
})
app.get("/reload-chat", async (c: Context) => {
  const platform = c.req.query("platform") || "z.ai"
  const appName = platform === "z.ai" ? "zai-proxy" : "mistral-proxy"

  let data: any = { success: false }
  data.success = await emitSocket(ioInstance, appName, "chat-reload", {
    payload: {},
    requestId: cuid(),
  })
  return c.json({ success: true })
})
export default app
