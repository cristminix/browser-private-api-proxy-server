import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
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

// Create raw HTTP server to handle both Hono and Socket.IO
const server = createServer()

// Create Socket.IO server attached to the HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // In production, specify your allowed origins
    methods: ["GET", "POST"]
  }
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New Socket.IO client connected:', socket.id)

  // Handle incoming messages from client
  socket.on('message', (data) => {
    try {
      // Socket.IO automatically parses JSON, but we'll handle both cases
      const message = typeof data === 'string' ? JSON.parse(data) : data
      console.log('Received Socket.IO message:', message)

      // Process the message based on its type
      switch (message.type) {
        case 'api_request':
          // Handle API request from client
          handleApiRequest(message, socket)
          break
        case 'ping':
          // Respond to ping
          socket.emit('message', { type: 'pong', timestamp: Date.now() })
          break
        default:
          socket.emit('message', {
            type: 'error',
            message: `Unknown message type: ${message.type}`
          })
      }
    } catch (error) {
      console.error('Error processing Socket.IO message:', error)
      socket.emit('message', {
        type: 'error',
        message: 'Invalid message format'
      })
    }
  })

  // Handle client disconnect
  socket.on('disconnect', (reason) => {
    console.log('Socket.IO client disconnected:', socket.id, 'reason:', reason)
  })

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket.IO error:', error)
  })

  // Send welcome message
  socket.emit('message', {
    type: 'connected',
    message: 'Successfully connected to Browser Private API Proxy Server'
  })
})

// Handle Hono requests through the raw HTTP server
// Socket.IO will handle its own requests internally
server.on('request', async (req, res) => {
  // Only handle non-Socket.IO requests with Hono
  if (req.url?.startsWith('/socket.io/')) {
    // Let Socket.IO handle its own requests via its internal mechanisms
    // We'll let the request continue to be processed by Socket.IO
    // by not sending any response here
    return;
  }

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
          res.end('Not Found')
        }
      }
    }
  } catch (error) {
    console.error('Error handling request:', error)
    if (!res.headersSent) {
      res.statusCode = 500
      if (!res.writableEnded) {
        res.end('Internal Server Error')
      }
    }
  }
})

// Function to handle API requests via Socket.IO
function handleApiRequest(message: any, socket: any) {
  // In a real implementation, this would forward the request to the target API
  // and return the result via Socket.IO

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

    socket.emit('message', response)
  }, 100)
}


// Start the server
const PORT = process.env.PORT || 4001

server.listen(PORT, () => {
  console.log(`Browser Private API Proxy Server running on port ${PORT}`)
  console.log(`REST API available at http://localhost:${PORT}/api/status`)
  console.log(`Socket.IO server available at http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...')
  server.close(() => {
    console.log('Server closed.')
    process.exit(0)
  })
})