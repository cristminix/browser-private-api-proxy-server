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
const chatHandlerAnswer: ChatAnswerHandler = ChatAnswerHandler.getInstance()

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
    async function* getAnswer() {
      let streamDone = false
      let completionId = 0
      let lastContent = ""
      while (!streamDone) {
        // `answer_stream_${requestId}`
        const answer = await chatHandlerAnswer.waitForAnswerKey(
          `answer_stream_${requestId}`
        )
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
          saveJsonFile(
            `src/providers/gemini/responses/response-${requestId}.json`,
            bufferLines
          )

          const chunkData = {
            content: "",
            index: completionId++,
            model: "gemini",
            done: true,
          }
          yield buildStreamChunk(chunkData)
        } else {
          const content = parseResponseBody(line)
          if (content.length > lastContent.length) {
            let streamContent = content.substr(
              lastContent.length,
              content.length - lastContent.length
            )
            lastContent = content
            if (streamContent.length > 0) {
              const chunkData = {
                content: streamContent,
                index: completionId++,
                model: "gemini",
              }
              yield buildStreamChunk(chunkData)
            } else {
              // console.log({ content })
            }
            // console.log({ outputText2 })
          }
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
  }
  const socket = await emitSocket(ioInstance, appName, "get-current-chat", {
    payload: {},
    requestId,
  })
  if (socket) {
    console.log(socket.id)
    // await setSocketBusy(socket.id)

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
