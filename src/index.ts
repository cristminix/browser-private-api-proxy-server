import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createServer } from 'node:http'
import { WebSocketServer, WebSocket as WSWebSocket } from 'ws'
import type { Context } from 'hono'

// Create Hono app
const app = new Hono()

// Enable CORS for all routes
app.use('/*', cors())

// REST API endpoint
app.get('/api/status', async (c: Context) => {
  return c.json({
    status: 'success',
    message: 'Browser Private API Proxy Server is running',
    timestamp: new Date().toISOString()
  })
})

// Additional REST API endpoint for proxying
app.post('/api/proxy', async (c: Context) => {
  try {
    const body = await c.req.json()
    console.log('Received proxy request:', body)

    // In a real implementation, this would forward the request to the target API
    // For now, we'll return a placeholder response
    return c.json({
      status: 'success',
      message: 'Proxy request received',
      originalRequest: body
    })
  } catch (error) {
    return c.json({ error: 'Invalid request body' }, 400)
  }
})

// Create raw HTTP server to handle both Hono and WebSocket
const server = createServer()

// Create WebSocket server attached to the HTTP server
const wss = new WebSocketServer({ server })

// Store connected WebSocket clients
const clients = new Set<WSWebSocket>()

// WebSocket connection handling
wss.on('connection', (ws: WSWebSocket) => {
  console.log('New WebSocket client connected')

  // Add client to the set
  clients.add(ws)

  // Handle incoming messages from client
  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString())
      console.log('Received WebSocket message:', message)

      // Process the message based on its type
      switch (message.type) {
        case 'api_request':
          // Handle API request from client
          handleApiRequest(message, ws)
          break
        case 'ping':
          // Respond to ping
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
          break
        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: `Unknown message type: ${message.type}`
          }))
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error)
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }))
    }
  })

  // Handle client disconnect
  ws.on('close', () => {
    console.log('WebSocket client disconnected')
    clients.delete(ws)
  })

  // Handle connection errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
    clients.delete(ws)
  })

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Successfully connected to Browser Private API Proxy Server'
  }))
})

// Function to handle API requests via WebSocket
function handleApiRequest(message: any, ws: WSWebSocket) {
  // In a real implementation, this would forward the request to the target API
  // and return the result via WebSocket

  console.log('Handling API request:', message.payload)

  // Simulate API call response
  setTimeout(() => {
    const response = {
      type: 'api_response',
      requestId: message.requestId,
      payload: {
        status: 'success',
        data: `Processed request: ${JSON.stringify(message.payload)}`
      }
    }

    ws.send(JSON.stringify(response))
  }, 100)
}

// Handle Hono requests through the raw HTTP server
server.on('request', async (req, res) => {
  try {
    // Create a proper Request object for Hono
    const url = new URL(req.url || '/', `http://${req.headers.host}`)
    const body = req.method && ['POST', 'PUT', 'PATCH'].includes(req.method)
      ? await new Promise<string>((resolve) => {
          let body = ''
          req.on('data', chunk => body += chunk.toString())
          req.on('end', () => resolve(body))
        })
      : undefined

    const request = new Request(url.toString(), {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body: body
    })

    // Convert the raw HTTP request to a Hono context-compatible request
    const response = await app.fetch(request)
    if (response) {
      // Set headers from the Hono response
      for (const [key, value] of response.headers) {
        res.setHeader(key, value)
      }
      res.statusCode = response.status
      const text = await response.text()
      res.end(text)
    } else {
      res.statusCode = 404
      res.end('Not Found')
    }
  } catch (error) {
    console.error('Error handling request:', error)
    res.statusCode = 500
    res.end('Internal Server Error')
  }
})

// Start the server
const PORT = process.env.PORT || 4001

server.listen(PORT, () => {
  console.log(`Browser Private API Proxy Server running on port ${PORT}`)
  console.log(`REST API available at http://localhost:${PORT}/api/status`)
  console.log(`WebSocket server available at ws://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...')
  server.close(() => {
    console.log('Server closed.')
    process.exit(0)
  })
})