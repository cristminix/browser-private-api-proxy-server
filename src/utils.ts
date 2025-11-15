async function delay(timeout: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true)
    }, timeout)
  })
}

const parseResponseBody = (jsonStreamTextInput: string) => {
  const lines = jsonStreamTextInput.split("\n\n")
  //   console.log(lines)
  let outBuffer = ""
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const jsonStr = line.replace("data: ", "")
      let jsonData
      try {
        jsonData = JSON.parse(jsonStr)
        // console.log(jsonData)
      } catch (error) {}

      if (jsonData) {
        const { type, data, error } = jsonData
        if (type === "chat:completion") {
          const { delta_content } = data
          if (delta_content) outBuffer += delta_content
        }
      }
    }
  }
  return outBuffer
}
export { delay, parseResponseBody }
