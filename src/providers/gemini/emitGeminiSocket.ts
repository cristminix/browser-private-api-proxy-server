import { Socket } from "socket.io"

import { emitSocket } from "../../global/fn/emitSocket"

const emitGeminiSocket = async (io: any, eventName: string, data: unknown): Promise<Socket | null> => {
  return await emitSocket(io, "gemini-proxy", eventName, data)
}

export { emitGeminiSocket }
