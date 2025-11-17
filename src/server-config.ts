import { Hono } from "hono"
import { cors } from "hono/cors"
import { createServer } from "node:http"
import type { Context } from "hono"
import { getSocketById, setupSocketIO } from "./socket-io-config"
import { getSocketAppName, getSocketConnectionIds } from "./db/msocket"
import cuid from "cuid"
import { delay } from "./utils"
import { kvstore } from "./db/store"
import { streamSSE } from "hono/streaming"

// Create Hono app
const app = new Hono()
let io: any = null
// Enable CORS for all routes
app.use("/*", cors())

// REST API endpoint
app.get("/api/status", async (c: Context) => {
  return c.json({
    status: "success",
    message: "Browser Private API Proxy Server is running",
    timestamp: new Date().toISOString(),
  })
})
const waitForChatAnswer = async (socketId: any) => {
  let stopWatcher = false
  setTimeout(() => {
    stopWatcher = true
  }, 60000)
  return new Promise(async (resolve, reject) => {
    let success = false
    let data = null
    while (!stopWatcher) {
      data = await kvstore.get(`answer_${socketId}`)
      if (data) {
        success = true
        stopWatcher = true
      }
      await delay(128)
    }
    if (success) {
      await kvstore.delete(`answer_${socketId}`)
      resolve(data)
    } else {
      reject(null)
    }
  })
}
const emitZaiSocket = async (eventName: string, data: any) => {
  const connectionIds = await getSocketConnectionIds()
  let socket: any = null
  for (const socketId of connectionIds) {
    const appName = await getSocketAppName(socketId)
    if (appName === "zai-proxy") {
      socket = getSocketById(io, socketId)
      if (socket) {
        socket.emit(eventName, data)
        break
      }
    }
    // console.log({ appName })
  }
  return socket
}
app.get("/api/fake-stream-chat", async (c: Context) => {
  console.log("FAKE STREAM CHAT")
  c.header("Content-Type", "text/event-stream")
  c.header("Cache-Control", "no-cache")
  c.header("Connection", "keep-alive")
  return streamSSE(c, async (stream) => {
    const chunks = [
      { type: "chat:completion", data: { delta_content: "", phase: "answer" } },
      { type: "chat:completion", data: { usage: { prompt_tokens: 27, completion_tokens: 1432, total_tokens: 1459, prompt_tokens_details: { cached_tokens: 0 }, words: 2838 }, phase: "other" } },

      {
        type: "chat:completion",
        data: {
          id: "chatcmpl-vs466ndbpsm",
          object: "chat.completion.chunk",
          created: 1759865334,
          model: "GLM-4-6-API-V1",
          choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 27, completion_tokens: 1432, total_tokens: 1459, prompt_tokens_details: { cached_tokens: 0 }, words: 2838 },
          phase: "answer",
        },
      },
      { type: "chat:completion", data: { done: true, delta_content: "", phase: "done" } },
      {
        type: "chat:completion",
        data: {
          role: "assistant",
          usage: { prompt_tokens: 27, completion_tokens: 1432, total_tokens: 1459, prompt_tokens_details: { cached_tokens: 0 }, words: 2838 },
          message_id: "e965e943-57bb-4dfe-ab57-f096bba7cd42",
          done: true,
          edit_index: 3107,
          edit_content: "",
          phase: "other",
        },
      },
    ]
    for await (const item of chunks) {
      const chunk = `data: ${JSON.stringify(item)}\n\n`
      await stream.write(chunk)
      await delay(256)
    }
    const endChunk = `\n\n`
    await stream.write(endChunk)
  })
})
app.get("/api/chat", async (c: Context) => {
  const prompt = c.req.query("prompt") || "What is the capital of france"
  let data: any = { success: false }
  const socket = await emitZaiSocket("chat", { payload: { prompt }, requestId: cuid() })
  if (socket) {
    console.log(socket.id)
    data = await waitForChatAnswer(socket.id)
  }

  console.log(data)
  return c.json(data)
})
app.post("/api/chat", async (c: Context) => {
  const body = await c.req.json()
  const prompt = body.prompt || "What is the capital of france"
  let data: any = { success: false }
  const socket = await emitZaiSocket("chat", { payload: { prompt }, requestId: cuid() })
  if (socket) {
    console.log(socket.id)
    data = await waitForChatAnswer(socket.id)
  }

  console.log(data)
  return c.json(data)
})
app.get("/api/reload-chat", async (c: Context) => {
  let data: any = { success: false }
  data.success = await emitZaiSocket("chat-reload", { payload: {}, requestId: cuid() })
  return c.json({ success: true })
})
// Additional REST API endpoint for proxying
app.post("/api/proxy", async (c: Context) => {
  try {
    const body = await c.req.json()
    console.log("Received proxy request:", body)

    // In a real implementation, this would forward the request to the target API
    // For now, we'll return a placeholder response
    return c.json({
      status: "success",
      message: "Proxy request received",
      originalRequest: body,
    })
  } catch (error) {
    return c.json({ error: "Invalid request body" }, 400)
  }
})

// Create raw HTTP server to handle both Hono and Socket.IO
export function createHttpServer() {
  const server = createServer()

  // Setup Socket.IO server
  io = setupSocketIO(server)

  // Handle Hono requests through the raw HTTP server
  // Socket.IO will handle its own requests internally
  server.on("request", async (req, res) => {
    // Only handle non-Socket.IO requests with Hono
    if (req.url?.startsWith("/socket.io/")) {
      // Let Socket.IO handle its own requests via its internal mechanisms
      // We'll let the request continue to be processed by Socket.IO
      // by not sending any response here
      return
    }

    try {
      // Create a proper Request object for Hono
      const url = new URL(req.url || "/", `http://${req.headers.host}`)
      const body =
        req.method && ["POST", "PUT", "PATCH"].includes(req.method)
          ? await new Promise<string>((resolve) => {
              let body = ""
              req.on("data", (chunk) => (body += chunk.toString()))
              req.on("end", () => resolve(body))
            })
          : undefined

      const request = new Request(url.toString(), {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body: body,
      })

      // Convert the raw HTTP request to a Hono context-compatible request
      const response = await app.fetch(request)
      if (response) {
        // Check if headers have already been sent
        if (!res.headersSent) {
          // Set headers from the Hono response
          for (const [key, value] of response.headers) {
            res.setHeader(key, value)
          }
          res.statusCode = response.status
          const text = await response.text()
          if (!res.writableEnded) {
            res.end(text)
          }
        }
      } else {
        if (!res.headersSent) {
          res.statusCode = 404
          if (!res.writableEnded) {
            res.end("Not Found")
          }
        }
      }
    } catch (error) {
      console.error("Error handling request:", error)
      if (!res.headersSent) {
        res.statusCode = 500
        if (!res.writableEnded) {
          res.end("Internal Server Error")
        }
      }
    }
  })

  return server
}
