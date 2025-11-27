import { buildStreamChunk } from "../../openai/buildStreamChunk"
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
export async function* makeStreamCompletionOrig(response: Response, options: Partial<StreamOptions> | string = {}): AsyncGenerator<any, void, unknown> {
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

  const { sso = false, model = "", print = false, onError, onData, onDone } = config

  try {
    // Validate response with more detailed error message
    if (!response.ok) {
      const errorText = await response.text()
      const error = new Error(`API request failed with status ${response.status}: ${errorText}`)
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
  try {
    while (state.validStream) {
      const { done, value } = await reader.read()

      if (done) {
        handleStreamCompletion(state, options)
        break
      }

      // Decode the chunk and add to buffer
      state.buffer += decoder.decode(value, { stream: true })

      // Process complete lines from buffer and yield results
      const lines = state.buffer.split("\n")
      // Keep the last incomplete part in buffer
      state.buffer = lines.pop() || ""

      // Process each complete line and increment index for each valid result
      for (const line of lines) {
        if (line.trim()) {
          const result = await processLineWithYield(line, state, options, index++)
          if (result) {
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
 * Handle stream completion
 */
function handleStreamCompletion(
  state: StreamState,
  options: {
    sso: boolean
    model: string
    onData?: (chunk: any) => void
    onDone?: (usage: UsageData) => void
  }
): void {
  const { sso, model, onData, onDone } = options

  // Send final event if in SSO mode
  if (sso) {
    const totalTokens = state.promptTokens + state.completionTokens
    const usage = state.calculatedUsage || {
      prompt_tokens: state.promptTokens,
      completion_tokens: state.completionTokens,
      total_tokens: totalTokens,
    }

    const finalChunk = buildStreamChunk({
      model,
      index: state.completionId,
      finishReason: "done",
      content: "",
      usage,
      done: true,
    })

    if (onData) onData(finalChunk)
  }

  if (onDone) {
    const usage = state.calculatedUsage || {
      prompt_tokens: state.promptTokens,
      completion_tokens: state.completionTokens,
      total_tokens: state.promptTokens + state.completionTokens,
    }
    onDone(usage)
  }

  state.validStream = false
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
    return buildStreamChunk({ content: parseResponseBody(line), model, index })
  } catch (err) {
    console.error("Error parsing stream line:", line, err)

    if (err instanceof Error) {
      console.error("Stream parsing error:", err.message)
    }
  }

  return null
}
