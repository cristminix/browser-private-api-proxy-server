export const parseResponseBody = (jsonStreamTextInput: string) => {
  const lines = JSON.parse(jsonStreamTextInput)
  //   console.log(lines)
  let outBuffer = ""
  for (const line of lines) {
    let jsonStr = line.replace(/^\d+:/, "")
    if (!line.trim()) continue
    // console.log({ jsonStr })
    let jsonData
    try {
      jsonData = JSON.parse(jsonStr)
      if (jsonData) {
        const { json } = jsonData
        jsonData = json
      }
      // console.log(jsonData)
    } catch (error) {
      console.error(error)
    }

    if (jsonData) {
      const { type, messageId, messageVersion, patches, disclaimer } = jsonData
      if (Array.isArray(patches)) {
        const [item] = patches
        //@ts-ignore
        const { op, path, value } = item
        // console.log({ op, path, value })
        switch (op) {
          case "append":
            // if (path === "/contentChunks/0/text") {
            outBuffer += value
            // }
            break
          case "replace":
            // if (path === "/contentChunks") {
            if (Array.isArray(value)) {
              for (const valueItem of value) {
                if (valueItem.type === "text") {
                  outBuffer += valueItem.text
                }
              }
            } else {
            }
            // console.log("-->", value)
            // }
            break
        }
      }
      // console.log(jsonData)
      // if (type === "message") {
      //   const { delta_content } = data
      //   if (delta_content) outBuffer += delta_content
      // }
    }
  }

  return outBuffer
}
