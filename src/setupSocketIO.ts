import { Server as SocketIOServer } from "socket.io"
import type { Socket } from "socket.io"
import type { Server as HttpServer } from "http"
import { getSocketConnectionIds, setSocketAppName, updateSocketConnectionIds } from "./db/msocket"
import { ChatAnswerHandler } from "./global/classes/ChatAnswerHandler"

// Define the type for our messages
interface Message {
  type: string
  [key: string]: any
}

// Function to setup Socket.IO server and handle connections
const sendHeartbeats = async (io: any) => {
  const HEARTBEAT_INTERVAL = 5000

  setInterval(async () => {
    const connectionIds = (await getSocketConnectionIds()) || []
    connectionIds.forEach((socketId: string) => {
      const socket = io.sockets.sockets.get(socketId)
      if (socket) {
        // console.log(`sending heartbeat to ${socketId}`)
        // Socket exists, can send heartbeat or perform other operations
        socket.emit("heartbeat", { timestamp: Date.now() })
      } else {
        updateSocketConnectionIds(socketId, "out")
      }
    })
  }, HEARTBEAT_INTERVAL)
}
let ioInstance: any = null

export function setupSocketIO(server: HttpServer, chatHandlerAnswer: ChatAnswerHandler): SocketIOServer {
  const io = new SocketIOServer(server, {
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
      // console.log(data)
      const { requestId } = data
      if (requestId) chatHandlerAnswer.notifyAnswer(socket.id, requestId, data)
    })
    socket.on("answer-stream", (data) => {
      console.log(data)
      const { requestId } = data
      if (requestId) chatHandlerAnswer.notifyAnswerKey(`answer_stream_${requestId}`, data)
    })
    socket.on("return-chat-id", (data) => {
      // console.log(data)
      // const { requestId } = data
      chatHandlerAnswer.notifyAnswerKey("return-chat-id", data)
    })
    socket.on("message", (data) => {
      try {
        const message: Message = typeof data === "string" ? JSON.parse(data) : data
        switch (message.type) {
          case "ping":
            socket.emit("message", { type: "pong", timestamp: Date.now() })
            break
        }
      } catch (error) {
        console.error("Error processing Socket.IO message:", error)
      }
    })

    // Handle client disconnect
    socket.on("disconnect", (reason) => {
      console.log("Socket.IO client disconnected:", socket.id, "reason:", reason)
      updateSocketConnectionIds(socket.id, "out")
    })

    // Handle connection errors
    socket.on("error", (error) => {
      console.error("Socket.IO error:", error)
    })
    socket.on("heartbeat", (data: any) => {
      // console.log("HEARTBEAT")

      if (!data) return
      const { appName } = data
      if (appName) setSocketAppName(socket.id, appName)
    })

    // Send welcome message
    socket.emit("connected")
  })
  ioInstance = io
  return io
}

export { ioInstance }
