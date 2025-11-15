import { kvstore } from "./store"

const updateSocketConnectionIds = async (
  socketId: string,
  t: string = "in",
  init = false
) => {
  let connectionIds = init ? [] : await kvstore.get("connectionIds")
  if (!connectionIds) {
    connectionIds = []
  }
  if (!init) {
    if (t === "in") {
      connectionIds.push(socketId)
    } else {
      // Remove element by value equal to newSocketId
      const index = connectionIds.indexOf(socketId)
      if (index > -1) {
        connectionIds.splice(index, 1)
        await unsetSocketAppName(socketId)
      }
    }
  }
  await kvstore.put("connectionIds", connectionIds)
  console.log({ connectionIds })
}
const getSocketConnectionIds = async () => {
  return (await kvstore.get("connectionIds")) || []
}
const getSocketAppName = async (socketId: string) => {
  return await kvstore.get(`appname_${socketId}`)
}
const unsetSocketAppName = async (socketId: string) => {
  return await kvstore.delete(`appname_${socketId}`)
}
const setSocketAppName = async (socketId: string, appName: string) => {
  await await kvstore.put(`appname_${socketId}`, appName)
}

export {
  updateSocketConnectionIds,
  getSocketConnectionIds,
  getSocketAppName,
  setSocketAppName,
  unsetSocketAppName,
}
