import { Server } from "socket.io"
import type { Socket } from "socket.io"

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

// Function to setup Socket.IO server and handle connections
export function setupSocketIO(server: any) {
  const io = new Server(server, {
    cors: {
      origin: "*", // In production, specify your allowed origins
      methods: ["GET", "POST"],
    },
  })

  // Socket.IO connection handling
  io.on("connection", (socket: Socket) => {
    console.log("New Socket.IO client connected:", socket.id)

    // Handle incoming messages from client
    socket.on("message", (data) => {
      try {
        // Socket.IO automatically parses JSON, but we'll handle both cases
        const message: Message =
          typeof data === "string" ? JSON.parse(data) : data
        console.log("Received Socket.IO message:", message)

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
    })

    // Handle connection errors
    socket.on("error", (error) => {
      console.error("Socket.IO error:", error)
    })

    // Send welcome message
    socket.emit("message", {
      type: "connected",
      message: "Successfully connected to Browser Private API Proxy Server",
    })
  })

  return io
}
