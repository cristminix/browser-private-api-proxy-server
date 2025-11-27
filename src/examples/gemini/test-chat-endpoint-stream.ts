// import { io } from "socket.io-client"

import { makeStreamCompletion } from "../../providers/gemini/makeStreamCompletion"
import { parseResponseBody } from "../../providers/gemini/parseResponseBody"

// import fetch from "node:fetch"
const main = async () => {
  // Get prompt from CLI arguments or use default
  const prompt = process.argv[2] || "Gimme the recommended places in the world"
  // const startTime = performance.now()
  console.log("--Sending request to gemini")
  const response = await fetch(`http://127.0.0.1:4001/api/chat-stream?platform=gemini&prompt=${encodeURIComponent(prompt)}`)

  for await (const chunk of makeStreamCompletion(response, {
    sso: false,
    model: "gemini",
  })) {
    // console.log(chunk)
    const bufferChunk = chunk.choices[0].delta.content
    if (bufferChunk) {
      // outputBuffer_content += bufferChunk
      process.stdout.write(bufferChunk)
    }
  }
  console.log("\n")
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
