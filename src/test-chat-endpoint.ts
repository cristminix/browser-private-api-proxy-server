// import { io } from "socket.io-client"

import { parseResponseBody } from "./utils"

// import fetch from "node:fetch"
const main = async () => {
  const response = await fetch(
    "http://127.0.0.1:4001/api/chat?prompt=give+me+unique+answer+of+what+is+beautiful+place+on+earth+jawab+dengan+bahasa+indonesia?"
  )
  const data = await response.json()

  const jsonResponseStreamInput = data.body

  const text = parseResponseBody(jsonResponseStreamInput)
  console.log(text)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
