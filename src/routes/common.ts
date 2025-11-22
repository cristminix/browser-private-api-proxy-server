import { Context, Hono } from "hono"
import cuid from "cuid"
import { delay } from "../global/fn/delay"
import { streamSSE } from "hono/streaming"
import { generateFakeChatChunks as generateZaiFakeChatChunks } from "../providers/zai/generateFakeChatChunks"
import { generateFakeChatChunks as generateMistralFakeChatChunks } from "../providers/mistral/generateFakeChatChunks"
import { generateFakeChatChunks as generateDeepseekFakeChatChunks } from "../providers/deepseek/generateFakeChatChunks"

const app = new Hono()

app.get("/status", async (c: Context) => {
  return c.json({
    status: "success",
    message: "Browser Private API Proxy Server is running",
    timestamp: new Date().toISOString(),
  })
})

// Handler function untuk fake stream chat
const handleFakeStreamChat = async (c: Context) => {
  const platform = c.req.query("platform") || "z.ai"

  console.log("FAKE STREAM CHAT")
  c.header("Content-Type", "text/event-stream")
  c.header("Cache-Control", "no-cache")
  c.header("Connection", "keep-alive")
  return streamSSE(c, async (stream) => {
    let chunks: any = platform === "z.ai" ? generateZaiFakeChatChunks() : generateMistralFakeChatChunks()
    if (platform === "deepseek") {
      chunks = generateDeepseekFakeChatChunks()
      await stream.write(`event: ready\n`)
    }
    for await (const item of chunks) {
      let chunk = platform === "z.ai" ? `data: ${JSON.stringify(item)}\n\n` : `${item}\n\n`
      if (platform === "deepseek") {
        chunk = `data: ${JSON.stringify(item)}\n\n`
      }
      await stream.write(chunk)
      await delay(256)
    }
    if (platform === "deepseek") {
      chunks = generateDeepseekFakeChatChunks()
      await stream.write(`event: finish\ndata: {}\n\n`)
      await stream.write(`event: update_session\ndata: {"updated_at":1763778803.339492}\n\n`)
      await stream.write(`event: close\ndata: {"click_behavior":"none","auto_resume":false}\n\n`)
    } else {
      const endChunk = `\n\n`
      await stream.write(endChunk)
    }
  })
}

// Endpoint untuk GET request
app.get("/fake-stream-chat", handleFakeStreamChat)

// Endpoint untuk POST request
app.post("/fake-stream-chat", handleFakeStreamChat)

export default app
