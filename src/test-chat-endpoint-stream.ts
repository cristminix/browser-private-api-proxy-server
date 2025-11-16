// import { io } from "socket.io-client"

import { parseResponseBody } from "./utils"
import { makeStreamCompletion } from "./zai/makeStreamCompletion"
// import fetch from "node:fetch"
const main = async () => {
  const startTime = performance.now()
  const response = await fetch("http://127.0.0.1:4001/api/chat?prompt=give+me+unique+answer+of+what+is+beautiful+place+on+earth+jawab+dengan+bahasa+indonesia?")
  let data = await response.json()
  console.log(data.phase)
  if (data.phase === "FETCH") {
    const { url, body, headers } = data
    console.log({ url, body, headers })
    const response = await fetch(`https://chat.z.ai${url}`, {
      method: "POST",
      headers: { ...headers },
      body,
    })
    await makeStreamCompletion(response, false, "glm")
    await fetch("http://127.0.0.1:4001/api/reload-chat")
  } else {
    //   const jsonResponseStreamInput = data.body
    //   const text = parseResponseBody(jsonResponseStreamInput)
    //   console.log(text)
  }
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
