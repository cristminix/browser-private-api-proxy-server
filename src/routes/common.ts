import { Context, Hono } from "hono"
import cuid from "cuid"
import { delay } from "../global/fn/delay"
import { streamSSE } from "hono/streaming"

const app = new Hono()

app.get("/status", async (c: Context) => {
  return c.json({
    status: "success",
    message: "Browser Private API Proxy Server is running",
    timestamp: new Date().toISOString(),
  })
})

app.get("/fake-stream-chat", async (c: Context) => {
  console.log("FAKE STREAM CHAT")
  c.header("Content-Type", "text/event-stream")
  c.header("Cache-Control", "no-cache")
  c.header("Connection", "keep-alive")
  return streamSSE(c, async (stream) => {
    const chunks = generateFakeChatChunks()
    for await (const item of chunks) {
      const chunk = `data: ${JSON.stringify(item)}\n\n`
      await stream.write(chunk)
      await delay(256)
    }
    const endChunk = `\n\n`
    await stream.write(endChunk)
  })
})

/**
 * Menghasilkan data chunk palsu untuk simulasi streaming chat
 * @returns Array dari objek chunk chat
 */
function generateFakeChatChunks() {
  const messageId = cuid()
  const timestamp = Date.now()

  return [
    { type: "chat:completion", data: { delta_content: "", phase: "answer" } },
    {
      type: "chat:completion",
      data: {
        usage: {
          prompt_tokens: 27,
          completion_tokens: 1432,
          total_tokens: 1459,
          prompt_tokens_details: { cached_tokens: 0 },
          words: 2838,
        },
        phase: "other",
      },
    },
    {
      type: "chat:completion",
      data: {
        id: `chatcmpl-${messageId}`,
        object: "chat.completion.chunk",
        created: timestamp,
        model: "GLM-4-6-API-V1",
        choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: "stop" }],
        usage: {
          prompt_tokens: 27,
          completion_tokens: 1432,
          total_tokens: 1459,
          prompt_tokens_details: { cached_tokens: 0 },
          words: 2838,
        },
        phase: "answer",
      },
    },
    { type: "chat:completion", data: { done: true, delta_content: "", phase: "done" } },
    {
      type: "chat:completion",
      data: {
        role: "assistant",
        usage: {
          prompt_tokens: 27,
          completion_tokens: 1432,
          total_tokens: 1459,
          prompt_tokens_details: { cached_tokens: 0 },
          words: 2838,
        },
        message_id: messageId,
        done: true,
        edit_index: 3107,
        edit_content: "",
        phase: "other",
      },
    },
  ]
}

export default app
