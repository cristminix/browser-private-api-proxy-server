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

  let data = await response.json()
  // console.log(data)
  // process.exit()
  if (data.phase === "FETCH") {
    console.log("--Sending request to deepseek--")
    let { url, body, headers } = data
    // console.log({ url, body, headers })
    if (body) {
      const jsonBody = JSON.parse(body)
      const payload = {
        chat_session_id: "94c03880-a266-41a1-a2de-cc7cbe56402b",
        parent_message_id: 2,
        prompt: "siapa pacar jisoo?",
        ref_file_ids: [],
        thinking_enabled: false,
        search_enabled: false,
        client_stream_id: "20251122-289fbf6f716b4043",
      }

      // console.log(jsonBody)
      // jsonBody.messages = [{ role: "system", content: "Jawab singkat saja" }, ...jsonBody.messages]
      body = JSON.stringify(jsonBody)
    }
    const response = await fetch(`https://chat.deepseek.com${url}`, {
      method: "POST",
      headers: { ...headers },
      body,
    })
    for await (const chunk of makeStreamCompletion(response, {
      sso: false,
      model: "deepseek-chat",
    })) {
      // console.log(chunk)
      const bufferChunk = chunk.choices[0].delta.content
      if (bufferChunk) {
        // outputBuffer_content += bufferChunk
        process.stdout.write(bufferChunk)
      }
    }
    // await fetch("http://127.0.0.1:4001/api/reload-chat")
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
