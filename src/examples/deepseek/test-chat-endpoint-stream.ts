// import { io } from "socket.io-client"

import { makeStreamCompletion } from "../../providers/deepseek/makeStreamCompletion"

// import fetch from "node:fetch"
const main = async () => {
  // Get prompt from CLI arguments or use default
  const prompt = process.argv[2] || "Gimme the recommended places in the world"
  // const startTime = performance.now()
  const response = await fetch(`http://127.0.0.1:4001/api/chat?platform=gemini&prompt=${encodeURIComponent(prompt)}`)
  let data = await response.json()

  if (data.phase === "FETCH") {
    console.log("--Sending request to deepseek--")
    let { url, body, headers } = data
    // console.log({ url, body, headers })
    if (body) {
      const jsonBody = JSON.parse(body)

      // console.log(jsonBody)
      // jsonBody.messages = [{ role: "system", content: "Jawab singkat saja" }, ...jsonBody.messages]
      // body = JSON.stringify(jsonBody)
    }
    const response = await fetch(`https://gemini.google.com${url}`, {
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
