import fs from "fs/promises"
import { compressSystemMessage } from "../../providers/gemini/compressSystemMessage"

const main = async () => {
  const systemMessage = await fs.readFile("src/examples/gemini/kilo-system-messages.md", "utf-8")
  const newSystemMessage = await compressSystemMessage(systemMessage, /You are Kilo Code/)
  console.log(newSystemMessage)
  console.log({
    originalLength: systemMessage.length,
    newLength: newSystemMessage.length,
  })
}

main().catch((e) => {
  console.error(e)
})
