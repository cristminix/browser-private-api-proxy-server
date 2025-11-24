import { Socket } from "socket.io"
import { Server as SocketIOServer } from "socket.io"

import { getSocketAppName, getSocketBusy, getSocketConnectionIds } from "../../db/msocket"
import { getSocketById } from "./getSocketById"
import { delay } from "./delay"

const emitSocket = async (io: SocketIOServer, targetAppName: string, eventName: string, data: unknown): Promise<Socket | null> => {
  let retryCount = 0
  let maxRetryCount = 5
  let delayRetry = 1000
  while (retryCount <= maxRetryCount) {
    try {
      const connectionIds = await getSocketConnectionIds()

      if (!connectionIds || connectionIds.length === 0) {
        console.warn("No active socket connections found")
      }

      for (const socketId of connectionIds) {
        try {
          const appName = await getSocketAppName(socketId)
          console.log({ socketId, appName })
          if (appName === targetAppName) {
            const socketBusy = await getSocketBusy(socketId)
            console.log({ socketId, socketBusy })
            if (socketBusy) {
              continue
            }
            const socket = getSocketById(io, socketId)

            if (socket) {
              socket.emit(eventName, data)
              return socket
            }
          }
        } catch (error) {
          console.error(`Error processing socket ${socketId}:`, error)
        }
      }

      console.warn(`No ${targetAppName} socket found among active connections`)
    } catch (error) {
      console.error("Error in emitSocket:", error)
    }
    // Hanya retry jika bukan iterasi terakhir
    if (retryCount < maxRetryCount) {
      console.log(`Retry ${retryCount + 1}/${maxRetryCount + 1} in ${delayRetry}ms`)
      await delay(delayRetry)
      retryCount += 1
      delayRetry += 1000
    } else {
      break // Keluar dari loop jika sudah mencapai maksimal retry
    }
  }

  console.warn(`No ${targetAppName} socket found after ${maxRetryCount + 1} attempts`)
  return null
}

export { emitSocket }
