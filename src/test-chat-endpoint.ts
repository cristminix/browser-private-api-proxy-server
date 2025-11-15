// import { io } from "socket.io-client"

import { parseResponseBody } from "./utils"

// import fetch from "node:fetch"
const main = async () => {
  const startTime = performance.now()
  const response = await fetch(
    "http://127.0.0.1:4001/api/chat?prompt=give+me+unique+answer+of+what+is+beautiful+place+on+earth+jawab+dengan+bahasa+indonesia?"
  )
  const data = await response.json()

  const jsonResponseStreamInput = data.body

  const text = parseResponseBody(jsonResponseStreamInput)
  const endTime = performance.now()
  console.log(text)

  const elapsedTime = endTime - startTime

  // Convert to human readable format
  let readableTime
  if (elapsedTime < 1) {
    readableTime = `${elapsedTime.toFixed(3)} milliseconds`
  } else if (elapsedTime < 1000) {
    readableTime = `${elapsedTime.toFixed(2)} milliseconds`
  } else {
    const seconds = elapsedTime / 1000
    if (seconds < 60) {
      readableTime = `${seconds.toFixed(2)} seconds`
    } else {
      const minutes = seconds / 60
      readableTime = `${minutes.toFixed(2)} minutes`
    }
  }

  console.log(`Elapsed time: ${readableTime}`)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
