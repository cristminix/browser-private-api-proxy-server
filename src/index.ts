import { createHttpServer } from "./server-config"

// Create the HTTP server with both Hono and Socket.IO
const server = createHttpServer()

// Start the server
const PORT = process.env.PORT || 4001

server.listen(PORT, () => {
  console.log(`Browser Private API Proxy Server running on port ${PORT}`)
  console.log(`REST API available at http://localhost:${PORT}/api/status`)
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
