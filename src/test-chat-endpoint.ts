// import { io } from "socket.io-client"
// import fetch from "node:fetch"
const main = async () => {
  const response = await fetch("http://127.0.0.1:4001/api/chat")
  const data = await response.json()
  console.log(data)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
