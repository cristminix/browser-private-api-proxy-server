import cuid from "cuid"
import { io } from "socket.io-client"
class ProxyBridge {
  socketUrl = "http://localhost:4001"
  socketConnected = false
  socket: any = null
  socketLastError: any = null
  socketTimeout = 5000
  socketExitTimeout = 6000
  constructor() {
    this.socket = io(this.socketUrl, {
      // Disable automatic reconnection to allow the program to exit when server is not available
      autoConnect: true,
      reconnection: false, // Disable reconnection attempts
      timeout: this.socketTimeout, // 5 second timeout for connection attempts
      transports: ["websocket"], // Use only websocket transport
    })
    this.initSocketCallback()
  }
  initSocketCallback() {
    this.socket.on("connect", () => {
      this.socketConnected = true
    })

    this.socket.on("connect_error", (error: any) => {
      console.error("Failed to connect to Socket.IO server:", error.message)
      console.log("Exiting program as server is not available...")
      this.socketLastError = error
      this.socketConnected = false
    })

    this.socket.on("error", (error: any) => {
      console.error("Socket.IO error:", error)
      this.socketLastError = error
      this.socketConnected = false
    })

    this.socket.on("message", (data: any) => {
      console.log("Received message from server:", data)
    })

    this.socket.on("disconnect", (reason: any) => {
      console.log("Socket.IO connection closed:", reason)
      this.socketConnected = false
    })
  }
  async sendMessage(message: any) {
    return new Promise((resolve, reject) => {
      this.socket.emit("message", message)

      this.socket.off("message")
      this.socket.on("message", (data: any) => {
        // console.log({ data, message })
        if (data.type === "pong" && message.type === "ping") resolve(data)
      })
      setTimeout(() => {
        reject(null)
      }, this.socketExitTimeout) // Slightly longer than the socket timeout
    })
  }
  exitWhileSocketLost() {
    // Set a timeout to exit the program if connection is not established within a reasonable time

    setTimeout(() => {
      if (!this.socket.connected) {
        console.log("Connection timeout: Server not available, exiting...")
        process.exit(1)
      }
    }, this.socketExitTimeout) // Slightly longer than the socket timeout
  }
}

const main = async () => {
  const bridge = new ProxyBridge()
  const message = {
    type: "ping",
    requestId: cuid(),
  }
  const response = await bridge.sendMessage(message)
  console.log({ response })
  bridge.exitWhileSocketLost()
  process.exit(1)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
