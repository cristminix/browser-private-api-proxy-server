export interface DeepSeekChatPayload {
  chat_session_id: string
  parent_message_id: number
  prompt: string
  ref_file_ids: string[]
  thinking_enabled: boolean
  search_enabled: boolean
  client_stream_id: string
}
