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
  c.header("Content-Type", "text/event-stream; charset=utf-8")
  // c.header("Cache-Control", "no-cache")
  // c.header("Connection", "keep-alive")
  return streamSSE(c, async (stream) => {
    let chunks: any = platform === "z.ai" ? generateZaiFakeChatChunks() : generateMistralFakeChatChunks()
    if (platform === "deepseek") {
      chunks = generateDeepseekFakeChatChunks()
      c.header("access-control-allow-credentials", "true")
      c.header("cf-cache-status", "DYNAMIC")
      c.header("strict-transport-security", "max-age=31536000; includeSubDomains; preload")
      c.header("x-content-type-options", "nosniff")
      c.header("x-ds-served-by", "chat")
      c.header("x-ds-trace-id", cuid())
      c.header("server", "cloudflare")
    }
    for await (const item of chunks) {
      let chunk = platform === "z.ai" ? `data: ${JSON.stringify(item)}\n\n` : `${item}\n\n`
      if (platform === "deepseek") {
        let buffer = ""
        const { event, data } = item
        if (event) {
          buffer = `event: ${event}\n`
        }
        if (data) {
          buffer += `data: ${JSON.stringify(item)}\n\n`
        }
        await stream.write(buffer)
      } else {
        await stream.write(chunk)
      }

      await delay(256)
    }
    if (platform === "deepseek") {
      // chunks = generateDeepseekFakeChatChunks()
      // const {event,data} = ch
      // await stream.write(`event: finish\ndata: {}\n\n`)
      // await stream.write(`event: update_session\ndata: {"updated_at":1763778803.339492}\n\n`)
      // await stream.write(`event: close\ndata: {"click_behavior":"none","auto_resume":false}\n\n`)
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
