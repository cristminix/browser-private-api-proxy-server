import { buildStreamChunk } from "../../openai/buildStreamChunk"
import { parseConnectFrame } from "./createConnectFrame"
import { parseResponseBody } from "./parseResponseBody"

// Define interfaces for better type safety
interface StreamData {
  type: string
  data: {
    done: boolean
    delta_content?: string
    edit_content?: string
    usage?: UsageData
    error?: ErrorData
  }
}

interface UsageData {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

interface ErrorData {
  message?: string
  code?: string
}

interface StreamOptions {
  sso?: boolean
  model: string
  print?: boolean
  onError?: (error: Error) => void
  onData?: (chunk: any) => void
  onDone?: (usage: UsageData) => void
}

interface StreamState {
  promptTokens: number
  completionTokens: number
  calculatedUsage: UsageData | null
  buffer: string
  completionId: number
  validStream: boolean
}

/**
 * Process streaming response from API and convert to OpenAI-compatible format
 *
 * @param response - The response object from fetch API
 * @param options - Configuration options for stream processing
 * @returns Promise that resolves when stream processing is complete
 */
export async function* makeStreamCompletionOrig(
  response: Response,
  options: Partial<StreamOptions> | string = {}
): AsyncGenerator<any, void, unknown> {
  // Handle backward compatibility where options was a boolean
  const config: StreamOptions =
    typeof options === "boolean"
      ? { sso: options, model: "", print: false }
      : {
          sso: false,
          print: false,
          model: "",
          ...(options as Partial<StreamOptions>),
        }

  const {
    sso = false,
    model = "",
    print = false,
    onError,
    onData,
    onDone,
  } = config

  try {
    // Validate response with more detailed error message
    if (!response.ok) {
      const errorText = await response.text()
      const error = new Error(
        `API request failed with status ${response.status}: ${errorText}`
      )
      if (onError) onError(error)
      throw error
    }

    // Check if response body exists
    if (!response.body) {
      const error = new Error("Streaming not supported in this environment")
      if (onError) onError(error)
      throw error
    }

    // Initialize stream state
    const state: StreamState = {
      promptTokens: 0,
      completionTokens: 0,
      calculatedUsage: null,
      buffer: "",
      completionId: 1,
      validStream: true,
    }

    // Process the stream and yield results
    yield* processStreamWithYield(response, state, {
      sso,
      model,
      print,
      onData,
      onDone,
    })
  } catch (error) {
    if (onError && error instanceof Error) {
      onError(error)
    } else {
      throw error
    }
  }
}

/**
 * Process the stream data and yield results
 */
async function* processStreamWithYield(
  response: Response,
  state: StreamState,
  options: {
    sso: boolean
    model: string
    print: boolean
    onData?: (chunk: any) => void
    onDone?: (usage: UsageData) => void
  }
): AsyncGenerator<any, void, unknown> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let index = 0
  let hasYieldedFinalChunk = false

  try {
    while (state.validStream) {
      const { done, value } = await reader.read()
      if (value) {
        // console.log(`Received chunk of ${value.length} bytes`)

        // First, try to decode as text to see if it looks like JSON or text data
        const textChunk = decoder.decode(value, { stream: true })

        // Check if this looks like text data (contains readable characters)
        const isTextData = /^[\s\[\]{}",:0-9a-zA-Z_-]*$/.test(textChunk.trim())

        if (isTextData && textChunk.trim().length > 0) {
          // This looks like text data, treat it as such
          // console.log("Detected text data, processing as text")
          state.buffer += textChunk
        } else if (value.length >= 5) {
          // Try to parse as a connect frame if it has enough bytes
          // Extract the length from the header (4 bytes after the flags byte)
          const frameLength =
            (value[1] << 24) | (value[2] << 16) | (value[3] << 8) | value[4]

          // If the frame length matches the actual value length, try to parse it
          if (
            5 + frameLength === value.length &&
            frameLength > 0 &&
            frameLength < 100000
          ) {
            try {
              const decodedValue = parseConnectFrame(value, decoder)
              // parseConnectFrame already logs the decoded value
              // console.log("Successfully parsed a frame!")
              // Add the decoded payload to the string buffer
              state.buffer = decodedValue.jsonPayload
            } catch (error) {
              // console.error("Error parsing connect frame:", error)
              // If parsing fails, treat the value as regular text data
              state.buffer += textChunk
            }
          } else {
            // If the length doesn't match or is unreasonable, treat as text
            // console.log(
            //   "Frame length mismatch or unreasonable, treating as text"
            // )
            state.buffer += textChunk
          }
        } else {
          // If the value is less than 5 bytes or doesn't look like text, treat it as text data
          // console.log("Short chunk or non-text data, treating as text")
          state.buffer += textChunk
        }
      } else {
        // Log when value is undefined to understand the stream structure
        // console.log("Received undefined value from stream")
      }
      if (done) {
        // Handle stream completion and yield the final chunk if not in SSO mode
        const totalTokens = state.promptTokens + state.completionTokens
        const usage = state.calculatedUsage || {
          prompt_tokens: state.promptTokens,
          completion_tokens: state.completionTokens,
          total_tokens: totalTokens,
        }

        const finalChunk = buildStreamChunk({
          model: options.model,
          index: state.completionId,
          finishReason: "done",
          content: "",
          usage,
          done: true,
        })
        // console.log({ finalChunk })
        hasYieldedFinalChunk = true
        yield finalChunk

        // handleStreamCompletion(state, options)
        break
      }

      // Process complete lines from buffer and yield results
      const lines = state.buffer.split("\n")
      // console.log(
      //   `Processing ${lines.length} lines from buffer. Buffer length: ${state.buffer.length}`
      // )

      // Keep the last incomplete part in buffer
      state.buffer = lines.pop() || ""

      // Process each complete line and increment index for each valid result
      for (const line of lines) {
        if (line.trim()) {
          // console.log(
          //   `Processing line: ${line.substring(0, 100)}${
          //     line.length > 100 ? "..." : ""
          //   }`
          // )
          const result = await processLineWithYield(
            line,
            state,
            options,
            index++
          )
          if (result) {
            // console.log(`Generated result:`, result)
            // Check if this is a final chunk
            if (result.finish_reason) {
              hasYieldedFinalChunk = true
            }
            yield result
          }
        }
      }
    }
  } finally {
    // Ensure reader is released even if an error occurs
    reader.releaseLock()
  }
}

/**
 * Process a single line from the stream and return result
 */
async function processLineWithYield(
  line: string,
  state: StreamState,
  options: {
    model: string
  },
  index
): Promise<any> {
  const { model } = options

  if (!line.trim()) {
    return null
  }

  try {
    // Skip special lines like )]}' and numeric lines
    if (line.trim() === ")]}'" || /^\d+$/.test(line.trim())) {
      // console.log(`Skipping special line: ${line.trim()}`)
      return null
    }

    const content = parseResponseBody(line)

    // Check if this is the end of the stream
    // If the content is empty or the line indicates completion, set finish_reason
    const isCompletionEnd =
      !content || line.includes("DONE") || line.includes("finished")

    // Only return a chunk if we have actual content
    if (content && content.trim().length > 0) {
      return buildStreamChunk({
        content,
        model,
        index,
        finishReason: isCompletionEnd ? "stop" : null,
      })
    }

    return null
  } catch (err) {
    console.error("Error parsing stream line:", line, err)

    if (err instanceof Error) {
      console.error("Stream parsing error:", err.message)
    }
  }

  return null
}
