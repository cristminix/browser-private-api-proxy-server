import { WebSocket } from 'ws'

// Create a WebSocket connection to the server
const ws = new WebSocket('ws://localhost:4001')

ws.on('open', () => {
  console.log('Connected to WebSocket server')

  // Send a test API request
  const testMessage = {
    type: 'api_request',
    requestId: 'test-123',
    payload: {
      api: 'browser.storage.local.get',
      data: { key: 'test' }
    }
  }

  console.log('Sending test message:', testMessage)
  ws.send(JSON.stringify(testMessage))

  // Also send a ping
  setTimeout(() => {
    ws.send(JSON.stringify({ type: 'ping' }))
  }, 1000)
})

ws.on('message', (data) => {
  const message = JSON.parse(data.toString())
  console.log('Received message from server:', message)
})

ws.on('close', () => {
  console.log('WebSocket connection closed')
})

ws.on('error', (error) => {
  console.error('WebSocket error:', error)
})