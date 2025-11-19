import { Socket } from "socket.io"
import { getSocketAppName, getSocketConnectionIds } from "./db/msocket"

async function delay(timeout: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true)
    }, timeout)
  })
}

const parseResponseBody = (jsonStreamTextInput: string) => {
  const lines = jsonStreamTextInput.split("\n\n")
  //   console.log(lines)
  let outBuffer = ""
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const jsonStr = line.replace("data: ", "")
      let jsonData
      try {
        jsonData = JSON.parse(jsonStr)
        // console.log(jsonData)
      } catch (error) {}

      if (jsonData) {
        const { type, data, error } = jsonData
        if (type === "chat:completion") {
          const { delta_content } = data
          if (delta_content) outBuffer += delta_content
        }
      }
    }
  }
  return outBuffer
}
const emitZaiSocket = async (io: any, eventName: string, data: unknown): Promise<Socket | null> => {
  try {
    const connectionIds = await getSocketConnectionIds()

    if (!connectionIds || connectionIds.length === 0) {
      console.warn("No active socket connections found")
      return null
    }

    for (const socketId of connectionIds) {
      try {
        const appName = await getSocketAppName(socketId)

        if (appName === "zai-proxy") {
          const socket = getSocketById(io, socketId)

          if (socket) {
            socket.emit(eventName, data)
            return socket
          }
        }
      } catch (error) {
        console.error(`Error processing socket ${socketId}:`, error)
        // Continue with next socket in case of error
      }
    }

    console.warn('No "zai-proxy" socket found among active connections')
    return null
  } catch (error) {
    console.error("Error in emitZaiSocket:", error)
    return null
  }
}
// Function to get a socket by its ID
function getSocketById(io: any, socketId: string) {
  return io.sockets.sockets.get(socketId) || null
}
export { delay, parseResponseBody, emitZaiSocket, getSocketById }
