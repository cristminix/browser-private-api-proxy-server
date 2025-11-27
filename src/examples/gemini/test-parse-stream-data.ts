// import fetch from "node:fetch"
import * as fs from "fs/promises"
import { parseResponseBody } from "../../providers/gemini/parseResponseBody"
import { loadJsonFile } from "../../global/fn/loadJsonFile"

const main = async () => {
  const buffer = await fs.readFile("src/providers/gemini/response-002.txt", "utf-8")
  const bufferLines = await loadJsonFile("src/providers/gemini/responses/response-cmigwpj5n0000ygtdgo7a1sqi.json")
  // const buffer2 = bufferLines.join(" ")
  let lastLine = ""
  for (const bfl of bufferLines) {
    // console.log({ bfl })

    let outputText = parseResponseBody(bfl)
    if (outputText.length > lastLine.length) {
      let outputText2 = outputText.substr(lastLine.length, outputText.length - lastLine.length)
      lastLine = outputText

      console.log({ outputText2 })
    }
  }
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
