import { Hono } from "hono"
import { cors } from "hono/cors"
import { createServer } from "node:http"
import { ChatAnswerHandler } from "./global/classes/ChatAnswerHandler"
import openai from "./routes/openai"
import common from "./routes/openai"
import chatBridge from "./routes/chat-bridge"
import { setupSocketIO } from "./setupSocketIO"
// Create Hono app
const app = new Hono()
// Enable CORS for all routes
app.use("/*", cors())
app.route("/v1", openai)
// REST API endpoint
app.route("/api", common)
app.route("/api", chatBridge)

// Create raw HTTP server to handle both Hono and Socket.IO
export function createHttpServer() {
  const server = createServer()
  const chatHandlerAnswer = ChatAnswerHandler.getInstance()

  setupSocketIO(server, chatHandlerAnswer)
  server.on("request", async (req, res) => {
    if (req.url?.startsWith("/socket.io/")) {
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

          // Check if this is a streaming response
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("text/event-stream")) {
            // For streaming responses, pipe the response body directly
            if (response.body) {
              response.body.pipeTo(
                new WritableStream({
                  write(chunk) {
                    if (!res.writableEnded) {
                      res.write(chunk)
                    }
                  },
                  close() {
                    if (!res.writableEnded) {
                      res.end()
                    }
                  },
                })
              )
            }
          } else {
            // For non-streaming responses, use the original approach
            const text = await response.text()
            if (!res.writableEnded) {
              res.end(text)
            }
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
