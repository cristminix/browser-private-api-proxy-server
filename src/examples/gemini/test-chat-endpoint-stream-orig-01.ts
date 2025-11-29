// import { io } from "socket.io-client"

import { makeStreamCompletionOrig } from "../../providers/gemini/makeStreamCompletionOrig"
import { cleanInvalidMarkdownCodeBlocks } from "../../providers/gemini/cleanInvalidMarkdownCodeBlocks"
import { makeStreamCompletion } from "../../providers/gemini/makeStreamCompletion"
import { parseResponseBody } from "../../providers/gemini/parseResponseBody"
import dotenv from "dotenv"
import unescapeJs from "unescape-js"
dotenv.config()
// import fetch from "node:fetch"
function cleanContent(input) {
  return input
    .replace("\\*", "*")
    .replace("\\*", "*")
    .replace("\\`", "`")
    .replace("\\.", ".")
}
const main = async () => {
  // Get prompt from CLI arguments or use default
  const prompt = process.argv[2] || "Gimme the recommended places in the world"
  // const startTime = performance.now()
  const response = await fetch(
    `http://127.0.0.1:4001/api/chat?platform=gemini&prompt=${encodeURIComponent(
      prompt
    )}`
  )

  let data = await response.json()
  // console.log(data)
  // process.exit()
  if (data.phase === "FETCH") {
    // console.log("--Sending request to gemini")

    let { url, body, headers } = data
    if (body) {
    }
    const response = await fetch(`https://gemini.google.com${url}`, {
      method: "POST",
      headers: { ...headers, cookie: process.env.GEMINI_COOKIE },
      body,
    })
    // console.log(response.ok)
    const chunks = makeStreamCompletionOrig(response, { model: "", sso: false })
    let lastContent = ""
    let fullContent = "" // Track the full accumulated content
    let partialContent = ""

    for await (const chunk of chunks) {
      let content = cleanContent(chunk.choices[0].delta.content)

      if (chunk.finish_reason === "done") {
        content = fullContent
      }
      // Check if this is new content (not empty)
      if (content && content.trim() !== "") {
        // Clean invalid markdown code blocks from content using the dedicated function
        const cleanedContent = cleanInvalidMarkdownCodeBlocks(content, chunk)
        fullContent = content

        // Since each chunk contains the full content, we need to extract only the new part
        if (cleanedContent.length > lastContent.length) {
          partialContent = cleanedContent.substr(
            lastContent.length,
            cleanedContent.length - lastContent.length
          )

          process.stdout.write(partialContent)
        } else if (lastContent === "") {
          partialContent = cleanedContent

          fullContent = cleanedContent

          process.stdout.write(partialContent)
        }
        lastContent = cleanedContent
      }
    }
    console.log("")
  } else {
  }
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
