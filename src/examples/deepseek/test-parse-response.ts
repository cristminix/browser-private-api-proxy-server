import { convertToOpenaiTextStream } from "../../providers/deepseek/makeStreamCompletion"

const main = async () => {
  const item = {
    v: [
      { v: "pletion>", p: "fragments/1/content", o: "APPEND" },
      { v: "FINISHED", p: "status", o: "SET" },
      { v: 31985, p: "accumulated_token_usage" },
    ],
    p: "response",
    o: "BATCH",
  }
  const data0 = {
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
  }

  const data1 = {
    v: [
      { v: false, p: "has_pending_fragment" },
      { v: [{ id: 1, type: "RESPONSE", content: "Of", references: [], stage_id: 1 }], p: "fragments", o: "APPEND" },
    ],
    p: "response",
    o: "BATCH",
  }

  const data2 = { v: " course", p: "response/fragments/0/content", o: "APPEND" }
  const data3 = {
    v: [
      { v: "FINISHED", p: "status" },
      { v: 3871, p: "accumulated_token_usage" },
    ],
    p: "response",
    o: "BATCH",
  }
  //   const output = convertToOpenaiTextStream(data3, "", 8)
  const output = convertToOpenaiTextStream(item, "", 8)
  console.log(output)
}

main().catch((e) => console.error(e))
