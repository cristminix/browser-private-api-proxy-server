import cuid from "cuid"
import fs from "fs/promises"
const llmRequest = async (userMessage: string) => {
  const llmEndpoint = process.env.EXTERNAL_LLM_ENDPOINT ?? "http://127.0.0.1:6789/v1/chat/completions"
  const llmModel = process.env.EXTERNAL_LLM_MODEL ?? "qwen-portal,qwen3-coder-plus"
  const llmApiKey = process.env.EXTERNAL_LLM_API_KEY ?? ""
  const payload = {
    stream: false,
    messages: [{ role: "user", content: userMessage }],
    model: llmModel,
  }

  const response = await fetch(llmEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + llmApiKey,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  return data?.choices[0]?.message?.content
}

export const compressSystemMessage = async (input: string, pattern: null | RegExp = null, log = false) => {
  if (pattern) {
    if (!pattern.test(input)) {
      return input
    }
  }
  const prompt = "Compress this system message content but keep provided example and rules :\n```markdown\n" + input + "\n```"
  let llmResponseData = await llmRequest(prompt)
  llmResponseData = llmResponseData.replace(/^```markdown/, "").replace(/```$/, "")
  if (log) {
    console.log(llmResponseData)
    const id = cuid()
    try {
      fs.writeFile(`logs/compress-input-${id}.txt`, input)
      fs.writeFile(`logs/compress-output-${id}.txt`, llmResponseData)
    } catch (error) {}
    console.log({
      originalLength: input.length,
      newLength: llmResponseData.length,
    })
  }
  return llmResponseData
}
