import { Socket } from "socket.io"

import { emitSocket } from "../../global/fn/emitSocket"

const emitDeepSeekSocket = async (
  io: any,
  eventName: string,
  data: unknown
): Promise<Socket | null> => {
  return await emitSocket(io, "deepseek-proxy", eventName, data)
}

export { emitDeepSeekSocket }
