import cuid from "cuid"

/**
 * Menghasilkan },{data chunk palsu untuk simulasi streaming chat
 * @returns Array dari objek chunk chat
 */
export function generateFakeChatChunks() {
  const messageId = cuid()
  const timestamp = Date.now()

  return [
    { event: "ready" },
    { data: { request_message_id: 1, response_message_id: 2 } },

    { event: "update_session" },
    { data: { updated_at: timestamp } },
    {
      data: {
        v: {
          response: {
            message_id: 2,
            parent_id: 1,
            model: "",
            role: "ASSISTANT",
            thinking_enabled: false,
            ban_edit: false,
            ban_regenerate: false,
            status: "WIP",
            accumulated_token_usage: null,
            files: [],
            inserted_at: timestamp,
            search_enabled: false,
            feedback: null,
            has_pending_fragment: true,
            auto_continue: false,
            conversation_mode: "DEFAULT",
            fragments: [],
          },
        },
      },
    },
    {
      data: {
        v: [
          { v: false, p: "has_pending_fragment" },
          { v: [{ id: 1, type: "RESPONSE", content: "你好", references: [], stage_id: 1 }], p: "fragments", o: "APPEND" },
        ],
        p: "response",
        o: "BATCH",
      },
    },
    { data: { v: "！", p: "response/fragments/0/content", o: "APPEND" } },
    { data: { v: "😊" } },
    { data: { v: " " } },
    { data: { v: "很高兴" } },
    { data: { v: "见到" } },
    { data: { v: "你" } },
    { data: { v: "！\n\n" } },
    { data: { v: "我是" } },
    { data: { v: "Deep" } },
    { data: { v: "Se" } },
    { data: { v: "ek" } },
    { data: { v: "，" } },
    { data: { v: "由" } },
    { data: { v: "深度" } },
    { data: { v: "求" } },
    { data: { v: "索" } },
    { data: { v: "公司" } },
    { data: { v: "创造的" } },
    { data: { v: "AI" } },
    { data: { v: "助手" } },
    { data: { v: "。" } },
    { data: { v: "我可以" } },
    { data: { v: "帮你" } },
    { data: { v: "解答" } },
    { data: { v: "问题" } },
    { data: { v: "、" } },
    { data: { v: "协助" } },
    { data: { v: "写作" } },
    { data: { v: "、" } },
    { data: { v: "分析" } },
    { data: { v: "文档" } },
    { data: { v: "、" } },
    { data: { v: "编程" } },
    { data: { v: "等等" } },
    { data: { v: "各种" } },
    { data: { v: "任务" } },
    { data: { v: "。\n\n" } },
    { data: { v: "有什么" } },
    { data: { v: "我可以" } },
    { data: { v: "帮" } },
    { data: { v: "你的" } },
    { data: { v: "吗" } },
    { data: { v: "？" } },
    { data: { v: "无论是" } },
    { data: { v: "学习" } },
    { data: { v: "、" } },
    { data: { v: "工作" } },
    { data: { v: "还是" } },
    { data: { v: "生活中的" } },
    { data: { v: "问题" } },
    { data: { v: "，" } },
    { data: { v: "我" } },
    { data: { v: "都很" } },
    { data: { v: "乐意" } },
    { data: { v: "为你" } },
    { data: { v: "提供" } },
    { data: { v: "帮助" } },
    { data: { v: "！" } },
    { data: { v: "✨" } },
    {
      data: {
        v: [
          { v: "FINISHED", p: "status" },
          { v: 90, p: "accumulated_token_usage" },
        ],
        p: "response",
        o: "BATCH",
      },
    },

    { event: "finish" },
    { data: {} },

    { event: "update_session" },
    { data: { updated_at: timestamp } },

    { event: "title" },
    { data: { content: "AI Assistant Greets and Offers Help" } },

    { event: "close" },
    { data: { click_behavior: "none", auto_resume: false } },
  ]
}
