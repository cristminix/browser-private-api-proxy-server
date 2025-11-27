// import fetch from "node:fetch"
import * as fs from "fs/promises"
import { getImageData, parseResponseBody } from "../../providers/gemini/parseResponseBody"
import { loadJsonFile } from "../../global/fn/loadJsonFile"
import { imageData } from "./imageData"

const main = async () => {
  const result = getImageData(imageData)
  console.log(result)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
