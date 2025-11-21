import { Context, Hono } from "hono"
// import { ChatAnswerHandler } from "./ChatAnswerHandler"
import handleCompletions from "../openai/handleCompletions"
import { ioInstance } from "../setupSocketIO"
import { ChatAnswerHandler } from "../global/classes/ChatAnswerHandler"
const chatHandlerAnswer: ChatAnswerHandler = ChatAnswerHandler.getInstance()

const app = new Hono()
app.get("/models", async (c: Context) => {
  return c.json({
    type: "list",
    data: [{ model: "zai", id: "zai", alias: "zai", provider: "zai" }],
  })
})
app.post("/chat/completions", async (c: Context) => {
  const chatRequest = await c.req.json()

  return await handleCompletions(chatRequest, c, ioInstance, chatHandlerAnswer)
})
export default app
