import { io } from 'socket.io-client'

// Create a Socket.IO connection to the server
const socket = io('http://localhost:4001')

socket.on('connect', () => {
  console.log('Connected to Socket.IO server')

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
  socket.emit('message', testMessage)

  // Also send a ping
  setTimeout(() => {
    socket.emit('message', { type: 'ping' })
  }, 1000)
})

socket.on('message', (data) => {
  console.log('Received message from server:', data)
})

socket.on('disconnect', () => {
  console.log('Socket.IO connection closed')
})

socket.on('error', (error) => {
  console.error('Socket.IO error:', error)
})