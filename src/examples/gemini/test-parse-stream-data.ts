// import fetch from "node:fetch"
import * as fs from "fs/promises"
import { parseResponseBody } from "../../providers/gemini/parseResponseBody"

const main = async () => {
  const buffer = await fs.readFile("src/providers/gemini/response-001.txt", "utf-8")
  const outputText = parseResponseBody(buffer)
  console.log({ outputText })
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
