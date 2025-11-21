import { Socket } from "socket.io"
import { Server as SocketIOServer } from "socket.io"

import {
  getSocketAppName,
  getSocketBusy,
  getSocketConnectionIds,
} from "../../db/msocket"
import { getSocketById } from "./getSocketById"

const emitSocket = async (
  io: SocketIOServer,
  targetAppName: string,
  eventName: string,
  data: unknown
): Promise<Socket | null> => {
  try {
    const connectionIds = await getSocketConnectionIds()

    if (!connectionIds || connectionIds.length === 0) {
      console.warn("No active socket connections found")
      return null
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
        // Continue with next socket in case of error
      }
    }

    console.warn(
      "No " + targetAppName + "socket found among active connections"
    )
    return null
  } catch (error) {
    console.error("Error in emitZaiSocket:", error)
    return null
  }
}

export { emitSocket }
