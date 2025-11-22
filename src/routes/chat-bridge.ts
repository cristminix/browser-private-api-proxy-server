import { Context, Hono } from "hono"
import { ioInstance } from "../setupSocketIO"
import { ChatAnswerHandler } from "../global/classes/ChatAnswerHandler"
import { emitZaiSocket } from "../providers/zai/emitZaiSocket"
import cuid from "cuid"
import { setSocketBusy, unsetSocketBusy } from "../db/msocket"
import { emitSocket } from "../global/fn/emitSocket"
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
