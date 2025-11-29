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
/**
 * Memodifikasi query di dalam payload string yang sudah jadi.
 * @param {string} originalPayload - String body lengkap (contoh: "f.req=...&at=...").
 * @param {string} newQuery - Query baru yang akan disisipkan.
 * @returns {string|null} - Payload yang sudah dimodifikasi, atau null jika gagal.
 */
function modifyQueryInPayload(originalPayload, newQuery) {
  try {
    // --- Langkah 1: Pecah payload untuk mendapatkan parameter ---
    // Gunakan URLSearchParams untuk mempermudah pengambilan nilai 'f.req' dan 'at'
    const params = new URLSearchParams(originalPayload)
    const f_req_value = params.get("f.req")
    const at_value = params.get("at")

    if (!f_req_value) {
      console.error("Payload tidak mengandung parameter 'f.req'.")
      return null
    }

    // --- Langkah 2: Pecah struktur JSON bersarang ---
    // f.req_value adalah string seperti: [null,"[...json...]"]
    const outerArray = JSON.parse(f_req_value)
    const innerString = outerArray[1] // Ini adalah string dari array bagian dalam

    // innerString adalah string dari array besar, kita parse lagi
    const innerArray = JSON.parse(innerString)

    // --- Langkah 3: Ubah nilai query ---
    // Query berada di elemen pertama dari sub-array pertama
    if (innerArray[0] && innerArray[0].length > 0) {
      innerArray[0][0] = newQuery
    } else {
      console.error("Struktur payload tidak sesuai untuk mengubah query.")
      return null
    }

    // --- Langkah 4: Rakit kembali payload ---
    // Ubah array bagian dalam menjadi string
    const newInnerString = JSON.stringify(innerArray)
    // Buat array luar baru dengan string yang sudah diubah
    const newOuterArray = [null, newInnerString]
    // Ubah array luar menjadi string, ini akan menjadi nilai 'f.req' yang baru
    const newF_req_value = JSON.stringify(newOuterArray)

    // --- Langkah 5: Buat body payload final ---
    const newParams = new URLSearchParams()
    newParams.append("f.req", newF_req_value)
    // Jangan lupa sertakan kembali parameter 'at' yang asli
    if (at_value) {
      newParams.append("at", at_value)
    }

    return newParams.toString()
  } catch (error) {
    console.error(
      "Gagal memodifikasi payload. Pastikan format payload benar.",
      error
    )
    return null
  }
}
const originalPayload =
  "f.req=%5Bnull%2C%22%5B%5B%5C%22ceritakan%20tentang%20sejarah%20js%20%20promise.all%20and%20seatled%20%5C%22%2C0%2Cnull%2Cnull%2Cnull%2Cnull%2C0%5D%2C%5B%5C%22id%5C%22%5D%2C%5B%5C%22%5C%22%2C%5C%22%5C%22%2C%5C%22%5C%22%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5C%22%5C%22%5D%2C%5C%22!urmlueHNAAb9MTdP3TFCJQkyOaCmNVk7ADQBEArZ1NRwKWJKfMmugF-bfot7Z5YGiKb_x8RCSFgi06fFbyzcrgNRDIpw6qI-8hK4Uy6VAgAAAddSAAAABmgBB34AQYWbCzPtY4yVV55BdJuVZKVMpCh2PJDejZQRbcqzm2D3PdaBVgtGTwC9rz4gLR3f76kPthKRPPPwzKxg7ahJKJyimQN0TwoyGS9XS9R-rxH9VNYK38h3c5vnMriQ3UCQjSTqVp5rbAsZXcnXv12GRemvVdRdcUezJ1h6dHxj7pvdSoQs3pdeq6PcDp1raEYrXNDka_n2WenxaqnMdUKgLMQJLxX5mpmwPIt2SdcEDuFuTXebqyKYqiNzU8zUzU7GQSVGEWdOxRBKHRhzy3SbzA3qLrnMvuFeXJ3HJ2zqs8Ud5u-c7CwoZxH-2pH2dW4aYHj93a1a80V3_qOSFf4EbK7_r_SN1P212b2i6Exfsh9nRTuEf03ClDpeaxeUIO2TRusCl5yXn_HM5KMf0CofOO6L5jqbDRXhEcDKuCscqaW66CrfTmI209hDhdou7Vft_smsRmBGorlxHBO1owiVSp_x-FUAnsJ6v2Ebi9H_9oNcT9BAiPjHGroQnKtNZzICe5RQPaLJpm-NxhJXixr3zKXRHbpD2LsNqgdD5MW9-JAjnTxIUK7afWHEr83iN0fwbiYjsH8IhJ5A54j6JDmenjyr72wLk11gPe73VWjWsXPl0dNuzWMVHUOOs2vReVRSt2fiTXo9KnIDQjqfc4JT4eVgW4A8a1MWvDKVDWnJRu4zXwxYvQBr5ZfxcH3dje80FLmfYlDRC3-ERAc7XhKT_h0vdK6zNfc1opUHx7oiXy8snNjlvvPVTNVrCYAHvYEgB1pTyH_DCy1HmduPNWWexUBckdrZw-JtvHG1UCPMBMBjB0emJKSM_51lO8jSXCd3bpWNxOcJpTtnmxJAw3NFag3Icuw3ZJegc072mNnHZ46ywFohZFI1f34kfWjhPuOD8uxE9wkjBcKH88k6Brgn0UcLOm-rG--DcicUjNMuc3drgfSo4QjM8Xcx-d427LeF5YsTuk4CPxMNZGUVeR7v8N8BtJmyENlyRtqgyLyAO-fQdUhTnQgW435jQn8iZUte2M4I5Xp_QhgPACe3g6ZPchWh-ijDP_DZ17w66v1VE00CsKGir9fAyXzdiz7rRGsgkZQaQxaIjBDyJWaIDyIfc24rq2HjXZdKewJgds-E7qiRH4nrwGNtFArQbj3ViUss8IOzuAxlcelyimaRgUm2MjbRkRefzVEbW19D4iiLzpFI4A9K6Ph6RsQ8NukCfP8zYk8nv_MVKu601BlXa_U9UmeBKdOdVf49WdO78iW3xXyH9vF2ukEpQRU%5C%22%2C%5C%224bfdc884c6577313f957673284e2ba41%5C%22%2Cnull%2C%5B1%5D%2C1%2Cnull%2Cnull%2C1%2C0%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5B%5B0%5D%5D%2C0%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C1%2Cnull%2Cnull%2C%5B4%5D%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5B1%5D%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C0%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5C%2271BD4C2D-9DF2-4D8E-956A-1986027CF6F1%5C%22%2Cnull%2C%5B%5D%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5B%5D%5D%22%5D&at=ANHAVo2lGpm5vUg726xMoPFjjBY0%3A1764382372183&"
const main = async () => {
  // Get prompt from CLI arguments or use default
  const prompt = process.argv[2] || "Gimme the recommended places in the world"
  // const startTime = performance.now()
  // const response = await fetch(
  //   `http://127.0.0.1:4001/api/chat?platform=gemini&prompt=${encodeURIComponent(
  //     prompt
  //   )}`
  // )
  const queryBaru = "apa itu fetch API javascript"

  // Panggil fungsi untuk memodifikasi payload

  let data = {
    url: "/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20251125.06_p0&f.sid=-3323142058221652732&hl=id&_reqid=4645571&rt=c",
  }
  // console.log(data)
  // process.exit()
  if (1) {
    // console.log("--Sending request to gemini")
    const modifiedPayload = modifyQueryInPayload(originalPayload, queryBaru)

    let { url, body, headers } = data
    if (body) {
    }
    const response = await fetch(`https://gemini.google.com${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        cookie: process.env.GEMINI_COOKIE,
      },
      body: modifiedPayload,
    })
    console.log(JSON.stringify(headers, null, 2))
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
