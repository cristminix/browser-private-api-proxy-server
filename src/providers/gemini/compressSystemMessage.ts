const llmRequest = async (userMessage: string) => {
  const llmEndpoint = process.env.EXTERNAL_LLM_ENDPOINT ?? "http://127.0.0.1:6789/v1/chat/completions"
  const llmModel = process.env.EXTERNAL_LLM_MODEL ?? "qwen-portal,qwen3-coder-plus"
  const payload = {
    stream: false,
    messages: [{ role: "user", content: userMessage }],
    model: llmModel,
  }

  const response = await fetch(llmEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  return data?.choices[0]?.message?.content
}

export const compressSystemMessage = async (input: string, pattern: null | RegExp = null) => {
  if (pattern) {
    if (!pattern.test(input)) {
      return input
    }
  }
  const prompt = "Compress this system message content but keep provided example and rules :\n```markdown\n" + input + "\n```"
  let llmResponseData = await llmRequest(prompt)
  llmResponseData = llmResponseData.replace(/^```markdown/, "").replace(/```$/, "")

  console.log(llmResponseData)
  console.log({
    originalLength: input.length,
    newLength: llmResponseData.length,
  })
  return llmResponseData
}
