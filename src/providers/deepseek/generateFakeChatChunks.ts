import cuid from "cuid"

/**
 * Menghasilkan data chunk palsu untuk simulasi streaming chat
 * @returns Array dari objek chunk chat
 */
export function generateFakeChatChunks() {
  const messageId = cuid()
  const timestamp = Date.now()

  return [
    { request_message_id: 7, response_message_id: 8 },
    { updated_at: 1763778765.669429 },
    {
      v: {
        response: {
          message_id: 8,
          parent_id: 7,
          model: "",
          role: "ASSISTANT",
          thinking_enabled: false,
          ban_edit: false,
          ban_regenerate: false,
          status: "WIP",
          accumulated_token_usage: null,
          files: [],
          inserted_at: 1763778765.647,
          search_enabled: false,
          feedback: null,
          has_pending_fragment: true,
          auto_continue: false,
          conversation_mode: "DEFAULT",
          fragments: [],
        },
      },
    },
    {
      v: [
        { v: false, p: "has_pending_fragment" },
        { v: [{ id: 1, type: "RESPONSE", content: "Of", references: [], stage_id: 1 }], p: "fragments", o: "APPEND" },
      ],
      p: "response",
      o: "BATCH",
    },
    { v: " course", p: "response/fragments/0/content", o: "APPEND" },
    {
      v: [
        { v: "FINISHED", p: "status" },
        { v: 3871, p: "accumulated_token_usage" },
      ],
      p: "response",
      o: "BATCH",
    },
  ]
}
