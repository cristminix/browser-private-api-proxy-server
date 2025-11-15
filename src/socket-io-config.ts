import { Server } from "socket.io"
import type { Socket } from "socket.io"
import {
  getSocketConnectionIds,
  setSocketAppName,
  updateSocketConnectionIds,
} from "./db/msocket"
import { kvstore } from "./db/store"

// Define the type for our messages
interface Message {
  type: string
  [key: string]: any
}

// Define the type for our API request payload
interface ApiRequest {
  type: "api_request"
  requestId?: string
  payload: any
}

// Define the type for our API response payload
interface ApiResponse {
  type: "api_response"
  requestId?: string
  payload: any
}

// Function to handle API requests via Socket.IO
function handleApiRequest(message: ApiRequest, socket: Socket) {
  // In a real implementation, this would forward the request to the target API
  // and return the result via Socket.IO

  console.log("Handling API request:", message.payload)

  // Simulate API call response
  setTimeout(() => {
    const response: ApiResponse = {
      type: "api_response",
      requestId: message.requestId,
      payload: {
        status: "success",
        data: `Processed request: ${JSON.stringify(message.payload)}`,
      },
    }

    socket.emit("message", response)
  }, 100)
}

// Function to get a socket by its ID
export function getSocketById(io: any, socketId: string) {
  return io.sockets.sockets.get(socketId) || null
}

// Function to setup Socket.IO server and handle connections
const sendHeartbeats = async (io: any) => {
  const HEARTBEAT_INTERVAL = 5000

  setInterval(async () => {
    const connectionIds = (await getSocketConnectionIds()) || []
    connectionIds.forEach((socketId: string) => {
      const socket = io.sockets.sockets.get(socketId)
      if (socket) {
        console.log(`sending heartbeat to ${socketId}`)
        // Socket exists, can send heartbeat or perform other operations
        socket.emit("heartbeat", { timestamp: Date.now() })
      } else {
        updateSocketConnectionIds(socketId, "out")
      }
    })
  }, HEARTBEAT_INTERVAL)
}
export function setupSocketIO(server: any) {
  const io = new Server(server, {
    cors: {
      origin: "*", // In production, specify your allowed origins
      methods: ["GET", "POST"],
    },
  })
  sendHeartbeats(io)

  // Socket.IO connection handling
  io.on("connection", (socket: Socket) => {
    console.log("New Socket.IO client connected:", socket.id)
    updateSocketConnectionIds(socket.id, "in")

    // Handle incoming messages from client
    socket.on("answer", (data) => {
      console.log("received answer", data)
      kvstore.put(`answer_${socket.id}`, data)
    })
    socket.on("message", (data) => {
      try {
        // Socket.IO automatically parses JSON, but we'll handle both cases
        const message: Message =
          typeof data === "string" ? JSON.parse(data) : data
        // console.log("Received Socket.IO message:", message);

        // Process the message based on its type
        switch (message.type) {
          case "api_request":
            // Handle API request from client
            handleApiRequest(message as ApiRequest, socket)
            break
          case "ping":
            // Respond to ping
            socket.emit("message", { type: "pong", timestamp: Date.now() })
            break

          case "fetch_request":
            if (data.url) {
              if (data.url.includes("/api/v2/chat/completions")) {
                console.log(`Received url: ${data.url}`)
                console.log(`Received payload: ${data.body}`)
              }
            }
            break
          default:
            socket.emit("message", {
              type: "error",
              message: `Unknown message type: ${message.type}`,
            })
        }
      } catch (error) {
        console.error("Error processing Socket.IO message:", error)
        socket.emit("message", {
          type: "error",
          message: "Invalid message format",
        })
      }
    })

    // Handle client disconnect
    socket.on("disconnect", (reason) => {
      console.log(
        "Socket.IO client disconnected:",
        socket.id,
        "reason:",
        reason
      )
      updateSocketConnectionIds(socket.id, "out")
    })

    // Handle connection errors
    socket.on("error", (error) => {
      console.error("Socket.IO error:", error)
    })
    socket.on("heartbeat", (data: any) => {
      console.log("HEARTBEAT")

      if (!data) return
      const { appName } = data
      if (appName) setSocketAppName(socket.id, appName)
    })

    // Send welcome message
    socket.emit("connected")
  })

  return io
}
