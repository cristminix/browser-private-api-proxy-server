// import { io } from "socket.io-client"
import fs from "node:fs"
import { makeStreamCompletion } from "../../providers/mistral/makeStreamCompletion"
import { parseResponseBody } from "../../providers/mistral/parseResponseBody"

// import fetch from "node:fetch"
const main = async () => {
  // Get prompt from CLI arguments or use default
  // const exampleBufer = await fs.readFileSync(
  //   "src/providers/mistral/stream.txt",
  //   "utf-8"
  // )
  // const parsedBuffer = parseResponseBody(exampleBufer)
  // console.log(parsedBuffer)
  // process.exit()
  const prompt = process.argv[2] || "Gimme the recommended places in the world"
  // const startTime = performance.now()
  const response = await fetch(
    `http://127.0.0.1:4001/api/chat?platform=mistral.ai&prompt=${encodeURIComponent(
      prompt
    )}`
  )
  let responseData = await response.json()
  let { url, body, headers, data, phase } = responseData

  // console.log(responseData)
  if (responseData.phase === "FETCH") {
    console.log("--Sending request to mistral.ai")
    // console.log({ url, body, headers })
    if (body) {
      const jsonBody = JSON.parse(body)
      // jsonBody.features.enable_thinking = false
      // jsonBody.features.auto_web_search = true
      // jsonBody.features.web_search = true
      /**
       web_search: false,
    auto_web_search: false,
       * 
      */
      // console.log(jsonBody)
      // jsonBody.messages = [
      //   { role: "system", content: "Jawab singkat saja" },
      //   ...jsonBody.messages,
      // ]
      body = JSON.stringify(jsonBody)
    }
    const response = await fetch(`https://chat.mistral.ai${url}`, {
      method: "POST",
      headers: { ...headers },
      body,
    })
    await makeStreamCompletion(response, { sso: false, model: "glm" })
    // await fetch("http://127.0.0.1:4001/api/reload-chat")
  } else {
    // console.log("here", { data })
    // const jsonResponseStreamInput = responseData.data
    const text = parseResponseBody(data)
    console.log(text)
  }
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
