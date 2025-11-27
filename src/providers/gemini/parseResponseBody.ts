export const parseResponseBody = (jsonStreamTextInput: string) => {
  // Check if it's Gemini format (contains "wrb.fr")
  // For Gemini response format
  const lines = jsonStreamTextInput.split("\n")
  let outBuffer = ""

  for (const line of lines) {
    // console.log({ line })
    const content = parseResponseLine(line)
    if (content) outBuffer = content
  }
  return outBuffer.trim()
}

export function parseResponseLine(line: any) {
  let outBuffer = null
  if (line.trim() && !line.startsWith(")]}'") && line.includes("wrb.fr")) {
    try {
      const [parsed] = JSON.parse(line)
      // console.log({ parsed })
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (parsed.length >= 3 && typeof parsed[2] === "string") {
          try {
            const [inputJson] = JSON.parse(parsed[2])[4]
            const [idJson, contentJson] = inputJson
            const [content] = contentJson
            // console.log({ content })
            if (content) outBuffer = content
          } catch (parseError) {
            // console.error("Error parsing content JSON:", parseError, parsed[2])
          }
        }
      }
    } catch (e) {
      // Skip lines that are not in expected format
      console.error("Error parsing line:", e, line.substring(0, 100))
    }
  }
  return outBuffer
}
