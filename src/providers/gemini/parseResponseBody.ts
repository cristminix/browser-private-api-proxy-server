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
function isImageData(inputJson: any) {}
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
            if (content.includes("http://googleusercontent.com/image_generation_content/0")) {
              // console.log(JSON.stringify(inputJson, null, 2) + "\n----\n")
              const imageList = getImageData(inputJson)
              let imageStr = ""
              for (const img of imageList) {
                imageStr += `![${img.filename}](${img.url})`
              }
              // console.log(imageList)
              outBuffer = content.replace("http://googleusercontent.com/image_generation_content/0", imageStr)
            }
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
/**
 * Ekstrak data gambar dari variabel imageData
 * Fungsi ini mencari dan mengekstrak informasi gambar dari struktur data kompleks
 * yang dihasilkan oleh layanan Gemini
 *
 * @param inputJson - Data JSON yang berisi informasi gambar
 * @returns Array objek yang berisi informasi gambar (filename, url, mimeType, dll)
 */
export function getImageData(inputJson: any) {
  const imagesList: Array<{
    filename: string | null
    url: string | null
    mimeType: string | null
    dimensions: number[] | null
    timestamp: number[] | null
  }> = []

  try {
    // Cek struktur data yang benar-benar ada dalam imageData
    // Dari file imageData.ts, saya lihat bahwa data gambar mungkin ada di posisi yang berbeda
    if (inputJson && Array.isArray(inputJson)) {
      // Mencari data gambar dalam array kompleks
      for (let i = 0; i < inputJson.length; i++) {
        const element = inputJson[i]
        if (element && Array.isArray(element)) {
          // Cek apakah array ini berisi informasi gambar
          const result = extractImagesFromNestedArray(element)
          if (result.length > 0) {
            imagesList.push(...result)
          }
        }
      }
    }
  } catch (error) {
    console.error("Error parsing image data:", error)
  }

  return imagesList
}

/**
 * Fungsi bantu untuk mengekstrak data gambar dari array bersarang
 * Mencari struktur data gambar dalam array bersarang yang kompleks
 *
 * @param arr - Array bersarang yang akan dicari datanya
 * @returns Array objek yang berisi informasi gambar
 */
function extractImagesFromNestedArray(arr: any): Array<{
  filename: string | null
  url: string | null
  mimeType: string | null
  dimensions: number[] | null
  timestamp: number[] | null
}> {
  const imagesList: Array<{
    filename: string | null
    url: string | null
    mimeType: string | null
    dimensions: number[] | null
    timestamp: number[] | null
  }> = []

  // Fungsi rekursif untuk mencari URL gambar dalam array bersarang
  function searchForImage(data: any) {
    if (Array.isArray(data)) {
      for (const item of data) {
        if (Array.isArray(item)) {
          // Cek apakah array ini memiliki struktur seperti data gambar
          // Berdasarkan contoh imageData, data gambar memiliki struktur:
          // [null, 1, filename, url, null, encoded_data, ...]
          if (item.length >= 4 && item[3] && typeof item[3] === "string" && (item[3].includes("googleusercontent.com") || item[3].includes("lh3.googleusercontent.com"))) {
            // Ini tampaknya adalah entri gambar
            const imageDataInfo = {
              filename: typeof item[2] === "string" ? item[2] : null,
              url: typeof item[3] === "string" ? item[3] : null,
              mimeType: item[10] && typeof item[10] === "string" ? item[10] : null,
              dimensions: Array.isArray(item[14]) ? item[14] : null, // [width, height, size]
              timestamp: Array.isArray(item[8]) ? item[8] : null,
            }

            if (imageDataInfo.url) {
              imagesList.push(imageDataInfo)
            }
          } else {
            // Lanjutkan pencarian rekursif
            searchForImage(item)
          }
        }
      }
    }
  }

  searchForImage(arr)
  return imagesList
}
