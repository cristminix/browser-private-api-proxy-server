import { Socket } from "socket.io"

import { emitSocket } from "../global/fn/emitSocket"

const emitZaiSocket = async (
  io: any,
  eventName: string,
  data: unknown
): Promise<Socket | null> => {
  return await emitSocket(io, "zai-proxy", eventName, data)
}

export { emitZaiSocket }
