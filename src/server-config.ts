import { Hono } from "hono"
import { cors } from "hono/cors"
import { createServer } from "node:http"
import type { Context } from "hono"
import { getSocketById, setupSocketIO } from "./socket-io-config"
import { getSocketAppName, getSocketConnectionIds } from "./db/msocket"
import cuid from "cuid"
import { delay } from "./utils"
import { kvstore } from "./db/store"

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
const waitForAnswer = async (socketId: any) => {
  let stopWatcher = false
  let iteration = 0
  setTimeout(() => {
    stopWatcher = true
  }, 60000)
  return new Promise(async (resolve, reject) => {
    let success = false
    let data = null
    while (!stopWatcher) {
      // console.log(iteration)
      data = await kvstore.get(`answer_${socketId}`)
      if (data) {
        success = true
        // console.log(this.phaseData)
        stopWatcher = true
      }
      // if (iteration === 500) {
      //   break
      // }
      // iteration += 1
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
app.get("/api/chat", async (c: Context) => {
  const connectionIds = await getSocketConnectionIds()
  const prompt = c.req.query("prompt") || "What is the capital of france"
  console.log(connectionIds)
  let data: any = { success: false }
  for (const socketId of connectionIds) {
    const appName = await getSocketAppName(socketId)
    if (appName === "zai-proxy") {
      const socket = getSocketById(io, socketId)
      if (socket) {
        socket.emit("chat", { payload: { prompt }, requestId: cuid() })
        data = await waitForAnswer(socket.id)
        break
      }
    }
    console.log({ appName })
  }
  console.log(data)
  return c.json(data)
})
app.get("/api/reload-chat", async (c: Context) => {
  const connectionIds = await getSocketConnectionIds()
  // const prompt = c.req.query("prompt") || "What is the capital of france"
  // console.log(connectionIds)
  let data: any = { success: false }
  for (const socketId of connectionIds) {
    const appName = await getSocketAppName(socketId)
    if (appName === "zai-proxy") {
      const socket = getSocketById(io, socketId)
      if (socket) {
        socket.emit("chat-reload", { payload: {}, requestId: cuid() })
        // data = await waitForAnswer(socket.id)
        break
      }
    }
    // console.log({ appName })
  }
  // console.log(data)
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
