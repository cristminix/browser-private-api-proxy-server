import { buildStreamChunk } from "../../openai/buildStreamChunk"

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
export async function makeStreamCompletion(response: Response, options: Partial<StreamOptions> | string = {}): Promise<void> {
  // Handle backward compatibility where options was a boolean
  const config: StreamOptions =
    typeof options === "boolean"
      ? { sso: options, model: "", print: true }
      : {
          sso: false,
          print: true,
          model: "",
          ...(options as Partial<StreamOptions>),
        }

  const { sso = false, model = "", print = true, onError, onData, onDone } = config

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

    // Process the stream
    await processStream(response, state, { sso, model, print, onData, onDone })
  } catch (error) {
    if (onError && error instanceof Error) {
      onError(error)
    } else {
      throw error
    }
  }
}

/**
 * Process the stream data
 */
async function processStream(
  response: Response,
  state: StreamState,
  options: {
    sso: boolean
    model: string
    print: boolean
    onData?: (chunk: any) => void
    onDone?: (usage: UsageData) => void
  }
): Promise<void> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  try {
    while (state.validStream) {
      const { done, value } = await reader.read()

      if (done) {
        handleStreamCompletion(state, options)
        break
      }

      // Decode the chunk and add to buffer
      state.buffer += decoder.decode(value, { stream: true })

      // Process complete lines from buffer
      await processBufferLines(state, options)
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
 * Process complete lines from buffer
 */
async function processBufferLines(
  state: StreamState,
  options: {
    sso: boolean
    model: string
    print: boolean
    onData?: (chunk: any) => void
  }
): Promise<void> {
  // Split buffer by newlines and process each part
  const lines = state.buffer.split("\n")

  // Keep the last incomplete part in buffer
  state.buffer = lines.pop() || ""

  // Process each complete line
  for (const line of lines) {
    // console.log({ line })
    await processLine(line, state, options)
  }
}

/**
 * Process a single line from the stream
 */
async function processLine(
  line: string,
  state: StreamState,
  options: {
    sso: boolean
    model: string
    print: boolean
    onData?: (chunk: any) => void
  }
): Promise<void> {
  const { sso, model, print, onData } = options

  // Skip empty lines or DONE markers
  if (!line.trim() || line === "data: [DONE]") {
    return
  }

  try {
    // Process only data lines
    if (line.startsWith("data: ")) {
      // Extract JSON string after "data: "
      const jsonString = line.slice(6)

      // Validate that we have JSON content
      if (!jsonString) {
        return
      }

      const jsonData: any = JSON.parse(jsonString)
      // const { v } = jsonData
      // if (v) {
      await processChatCompletion(jsonData, state, { model, print, onData })
      // }
    }
  } catch (err) {
    // Log parsing errors but continue processing
    console.error("Error parsing stream line:", line, err)

    // For robustness, we could also emit an error event in SSO mode
    if (sso && err instanceof Error) {
      console.error("Stream parsing error:", err.message)
    }
  }
}

/**
 * Process chat completion data
 */
async function processChatCompletion(
  jsonData: StreamData,
  state: StreamState,
  options: {
    model: string
    print: boolean
    onData?: (chunk: any) => void
  }
): Promise<void> {
  const { model, print, onData } = options
  const { data } = jsonData
  // const { done, usage, error } = data

  // if (usage) {
  //   state.calculatedUsage = usage
  // }

  // if (error) {
  //   state.validStream = false
  //   console.error("Stream error:", error)
  //   return
  // }

  const result = convertToOpenaiTextStream(jsonData, model, state.completionId)

  if (result) {
    if (onData) {
      onData(result)
    }

    if (print && result.choices[0].delta.content) {
      process.stdout.write(result.choices[0].delta.content)
    }

    // Only increment completion ID if not a completion end event
    // if (!done) {
    //   state.completionId++
    // }
  } else {
    console.log(jsonData)
  }

  // if (done) {
  //   state.completionId++
  //   if (print) {
  //     process.stdout.write("\n\n")
  //   }
  // }
}

/**
 * Convert stream data to OpenAI-compatible format
 */
function convertToOpenaiTextStream(jsonData: any, model: string, completionId: number): any | null {
  const { v: inputData } = jsonData
  let content, done
  if (typeof inputData === "string") {
    content = inputData
  } else if (Array.isArray(inputData)) {
    for (const item of inputData) {
      const { v: nextData } = item
      if (nextData) {
        if (Array.isArray(nextData)) {
          for (const subItem of nextData) {
            const { type, content: text } = subItem
            if (text) {
              content = text
            }
          }
        }
      }
    }
  }
  if (typeof inputData === "object") {
    const { response } = inputData
    if (response) {
    }
  }
  // const { done, delta_content: text, edit_content: textEdit } = inputData

  if (content) {
    return buildStreamChunk({
      model,
      index: completionId,
      finishReason: done ? "finish" : null,
      content,
    })
  }

  return null
}
