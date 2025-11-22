import { type ChatSession } from "../../global/classes/ChatSession"
import { getLastUserMessageContent } from "../../providers/zai/getLastUserMessageContent"

export async function sendChatFinal(messages: any[], chatSession: ChatSession) {
  const prompt = getLastUserMessageContent(messages) ?? "Hai"
  // const startTime = performance.now()
  const response = await fetch(
    `http://127.0.0.1:4001/api/chat?platform=deepseek&prompt=${encodeURIComponent(
      prompt
    )}`
  )
  let data = await response.json()
  // console.log(data)
  // process.exit()
  if (data.phase === "FETCH") {
    // console.log("--Sending request to deepseek--")
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
    return response
  }
  return null
}
