export function createConnectFrame(jsonPayload, encoder): Uint8Array {
  const payloadBytes = encoder.encode(jsonPayload)

  const frame = new Uint8Array(5 + payloadBytes.length)
  frame[0] = 0 // flags byte (0 for uncompressed)
  // Set the 4-byte length in big-endian format
  const length = payloadBytes.length
  frame[1] = (length >> 24) & 0xff
  frame[2] = (length >> 16) & 0xff
  frame[3] = (length >> 8) & 0xff
  frame[4] = length & 0xff

  // Copy the payload data after the header
  frame.set(payloadBytes, 5)

  return frame
}

export function parseConnectFrame(
  frame: Uint8Array,
  decoder
): { jsonPayload: string; flags: number } {
  try {
    // Check if frame has minimum required length (header is 5 bytes)
    if (frame.length < 5) {
      throw new Error(`Frame too short to be valid. Length: ${frame.length}`)
    }

    // Extract flags byte
    const flags = frame[0]

    // Extract 4-byte length in big-endian format
    const length =
      (frame[1] << 24) | (frame[2] << 16) | (frame[3] << 8) | frame[4]

    // Verify that the frame has enough bytes for the declared length
    if (frame.length < 5 + length) {
      throw new Error(
        `Frame length does not match declared payload length. Frame: ${
          frame.length
        }, Expected: ${5 + length}`
      )
    }

    // Extract payload bytes
    const payloadBytes = frame.subarray(5, 5 + length)

    // Decode payload to string
    const jsonPayload = decoder.decode(payloadBytes)

    // Log the decoded value for debugging
    console.log({ jsonPayload, flags })

    return { jsonPayload, flags }
  } catch (error) {
    console.error("Error in parseConnectFrame:", error)

    // Instead of throwing an error, try to decode the entire frame as text
    // This handles cases where the data isn't in the expected frame format
    try {
      console.log("Attempting to decode frame as plain text...")
      const jsonPayload = decoder.decode(frame)
      console.log({ jsonPayload, flags: 0 })
      return { jsonPayload, flags: 0 }
    } catch (fallbackError) {
      console.error("Fallback decoding also failed:", fallbackError)
      throw new Error(
        `Failed to parse frame: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    }
  }
}
