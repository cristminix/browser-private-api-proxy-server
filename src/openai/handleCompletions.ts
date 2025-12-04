import { Context } from "hono"
import { ChatCompletionRequest, CompletionResult, StreamResponse, ChatResponse, ChatResponseStream } from "./types/chat"
import createCompletions from "./createCompletions"
import isPromptMode from "./isPromptMode"
import { streamSSE } from "hono/streaming"

/**
 * Mengirim hasil respons streaming ke klien
 * @param response - Stream response dari API
 * @param modelName - Nama model yang digunakan
 * @param promptMode - Mode prompt (true/false)
 * @param c - Context object dari Hono
 * @returns Promise<void>
 */
async function sendStreamResult(response: AsyncIterable<ChatResponseStream> | null, modelName: string, promptMode: boolean, c: Context): Promise<Response> {
  try {
    // Set headers untuk SSE
    c.header("Content-Type", "text/event-stream")
    c.header("Cache-Control", "no-cache")
    c.header("Connection", "keep-alive")
    c.header("X-Accel-Buffering", "no") // Disable nginx buffering if behind nginx

    return streamSSE(c, async (stream) => {
      if (!response) {
        console.error("Stream response is null or undefined")
        await stream.writeSSE({
          data:
            JSON.stringify({
              error: {
                message: "Stream response is null or undefined",
                type: "api_error",
                code: "null_response",
              },
            }) + "\n\n",
        })
        return
      }

      try {
        for await (const data of response) {
          // Validasi data sebelum mengirim
          if (!data) {
            console.warn("Received empty data chunk, skipping")
            continue
          }

          // Kirim data dalam format SSE
          await stream.writeSSE({ data: JSON.stringify(data) + "\n\n" })
        }
      } catch (streamError) {
        console.error("Error while processing stream:", streamError)
        await stream.writeSSE({
          data:
            JSON.stringify({
              error: {
                message: "Error while processing stream",
                type: "stream_error",
                code: "stream_processing_error",
              },
            }) + "\n\n",
        })
      }
    })
  } catch (error) {
    console.error("Error in sendStreamResult:", error)
    throw error
  }
}

/**
 * Mengirim hasil respons non-streaming ke klien
 * @param response - Completion response dari API
 * @param modelName - Nama model yang digunakan
 * @param promptMode - Mode prompt (true/false)
 * @param c - Context object dari Hono
 * @returns Promise<Response>
 */
async function sendResult(response: ChatResponse | null, modelName: string, promptMode: boolean, c: Context): Promise<Response> {
  try {
    if (!response || !response.choices || response.choices.length === 0) {
      console.error("Invalid response data:", response)
      return c.json(
        {
          error: {
            message: "Invalid response data",
            type: "api_error",
            code: "invalid_response",
          },
        },
        500
      )
    }

    const jsonResponse: any = {
      id: "chatcmpl-" + Date.now(),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: modelName,
      choices: promptMode
        ? response.choices.map((choice, index) => ({
            index,
            role: choice.message.role,
            text: choice.message.content,
            finish_reason: "stop",
          }))
        : response.choices.map((choice, index) => ({
            index,
            message: {
              role: choice.message.role,
              content: choice.message.content,
            },
            finish_reason: "stop",
          })),
      usage: response.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    }

    return c.json(jsonResponse)
  } catch (error) {
    console.error("Error in sendResult:", error)
    return c.json(
      {
        error: {
          message: "Internal server error",
          type: "api_error",
          code: "internal_error",
        },
      },
      500
    )
  }
}

/**
 * Menangani permintaan completion dari klien
 * @param chatRequest - Permintaan completion dari klien
 * @param c - Context object dari Hono
 * @param io - Socket.IO instance
 * @param chatHandler - Chat handler instance
 * @returns Promise<Response>
 */
async function handleCompletions(chatRequest: ChatCompletionRequest, c: Context, io: any, chatHandler: any) {
  try {
    // Validasi input
    if (!chatRequest || !chatRequest.model) {
      console.error("Invalid chat request:", chatRequest)
      return c.json(
        {
          error: {
            message: "Model is required",
            type: "invalid_request_error",
            code: "missing_model",
          },
        },
        400
      )
    }

    // Default stream ke true jika tidak diset
    if (typeof chatRequest.stream !== "boolean") {
      chatRequest.stream = false
    }

    console.log(`Processing completion request for model: ${chatRequest.model}, stream: ${chatRequest.stream}`)

    // Dapatkan respons dari createCompletions
    const response = await createCompletions(chatRequest, io, chatHandler)
    const streaming = chatRequest.stream
    const promptMode = isPromptMode(chatRequest)
    const modelName = chatRequest.model

    // Kirim respons berdasarkan mode streaming
    return streaming ? await sendStreamResult(response as AsyncIterable<ChatResponseStream>, modelName, promptMode, c) : await sendResult(response as ChatResponse, modelName, promptMode, c)
  } catch (error) {
    console.error("Error in handleCompletions:", error)
    return c.json(
      {
        error: {
          message: "Internal server error",
          type: "api_error",
          code: "internal_error",
        },
      },
      500
    )
  }
}

export default handleCompletions
