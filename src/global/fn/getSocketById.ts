// Function to get a socket by its ID
function getSocketById(io: any, socketId: string) {
  return io.sockets.sockets.get(socketId) || null
}

export { getSocketById }
