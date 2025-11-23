import { Context, Hono } from "hono"
// import { ChatAnswerHandler } from "./ChatAnswerHandler"
import handleCompletions from "../openai/handleCompletions"
import { ioInstance } from "../setupSocketIO"
import { ChatAnswerHandler } from "../global/classes/ChatAnswerHandler"
const chatHandlerAnswer: ChatAnswerHandler = ChatAnswerHandler.getInstance()

const app = new Hono()

// Helper function untuk membuat objek model dengan properti yang sama
const createModel = (name: string) => ({
  model: name,
  id: name,
  alias: name,
  provider: name,
})

app.get("/models", async (c: Context) => {
  return c.json({
    type: "list",
    data: [createModel("zai"), createModel("deepseek"), createModel("oreally")],
  })
})
app.post("/chat/completions", async (c: Context) => {
  const chatRequest = await c.req.json()

  return await handleCompletions(chatRequest, c, ioInstance, chatHandlerAnswer)
})
export default app
