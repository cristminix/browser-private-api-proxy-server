import { Socket } from "socket.io"
import { getSocketAppName, getSocketConnectionIds } from "../db/msocket"
import { getSocketById } from "../global/fn/getSocketById"

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

export { emitZaiSocket }
