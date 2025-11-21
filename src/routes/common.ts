import { Context, Hono } from "hono"
import cuid from "cuid"
import { delay } from "../global/fn/delay"
import { streamSSE } from "hono/streaming"
import { generateFakeChatChunks as generateZaiFakeChatChunks } from "../providers/zai/generateFakeChatChunks"
import { generateFakeChatChunks as generateMistralFakeChatChunks } from "../providers/mistral/generateFakeChatChunks"

const app = new Hono()

app.get("/status", async (c: Context) => {
  return c.json({
    status: "success",
    message: "Browser Private API Proxy Server is running",
    timestamp: new Date().toISOString(),
  })
})

app.get("/fake-stream-chat", async (c: Context) => {
  const platform = c.req.query("platform") || "z.ai"

  console.log("FAKE STREAM CHAT")
  c.header("Content-Type", "text/event-stream")
  c.header("Cache-Control", "no-cache")
  c.header("Connection", "keep-alive")
  return streamSSE(c, async (stream) => {
    const chunks =
      platform === "z.ai"
        ? generateZaiFakeChatChunks()
        : generateMistralFakeChatChunks()
    for await (const item of chunks) {
      const chunk =
        platform === "z.ai"
          ? `data: ${JSON.stringify(item)}\n\n`
          : `${item}\n\n`
      await stream.write(chunk)
      await delay(256)
    }
    const endChunk = `\n\n`
    await stream.write(endChunk)
  })
})

export default app
