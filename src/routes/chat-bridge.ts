import { Context, Hono } from "hono"
import { ioInstance } from "../setupSocketIO"
import { ChatAnswerHandler } from "../global/classes/ChatAnswerHandler"
import { emitZaiSocket } from "../zai/emitZaiSocket"
import cuid from "cuid"
const chatHandlerAnswer: ChatAnswerHandler = ChatAnswerHandler.getInstance()

const app = new Hono()
app.get("/chat", async (c: Context) => {
  const prompt = c.req.query("prompt") || "What is the capital of france"
  let data: any = { success: false }
  const requestId = cuid()
  const socket = await emitZaiSocket(ioInstance, "chat", { payload: { prompt }, requestId })
  if (socket) {
    console.log(socket.id)
    data = await chatHandlerAnswer.waitForAnswer(socket.id, requestId)
  }

  // console.log(data)
  return c.json(data)
})
app.post("/chat", async (c: Context) => {
  const body = await c.req.json()
  const prompt = body.prompt || "What is the capital of france"
  let data: any = { success: false }
  const requestId = cuid()

  const socket = await emitZaiSocket(ioInstance, "chat", { payload: { prompt }, requestId })
  if (socket) {
    console.log(socket.id)
    data = await chatHandlerAnswer.waitForAnswer(socket.id, requestId)
  }

  // console.log(data)
  return c.json(data)
})

app.get("/reload-chat", async (c: Context) => {
  let data: any = { success: false }
  data.success = await emitZaiSocket(ioInstance, "chat-reload", { payload: {}, requestId: cuid() })
  return c.json({ success: true })
})
export default app
