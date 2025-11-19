import { updateSocketConnectionIds } from "./db/msocket"
import { createHttpServer } from "./server-config"
const main = async () => {
  await updateSocketConnectionIds("", "init", true)

  // Create the HTTP server with both Hono and Socket.IO
  const server = createHttpServer()

  // Start the server
  const PORT = process.env.PORT || 4001

  server.listen(PORT, () => {
    console.log(`Browser Private API Proxy Server running on port ${PORT}`)
    console.log(`Openai Compatible Endpoint API available at http://localhost:${PORT}/v1/chat/completions`)
    console.log(`Socket.IO server available at http://localhost:${PORT}`)
  })

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("Shutting down gracefully...")
    server.close(() => {
      console.log("Server closed.")
      process.exit(0)
    })
  })
}
main().catch((e) => console.error(e))
