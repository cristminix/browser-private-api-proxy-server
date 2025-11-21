import cuid from "cuid"

/**
 * Menghasilkan data chunk palsu untuk simulasi streaming chat
 * @returns Array dari objek chunk chat
 */
export function generateFakeChatChunks() {
  const messageId = cuid()
  const timestamp = Date.now()
  const fakeStreamData = `16:{"json":{"disclaimers":[]}}
15:{"json":{"type":"message","messageId":"6a2c14de-f38f-4985-ab83-9c51ccd52406","messageVersion":0,"patches":[{"op":"replace","path":[],"value":{"role":"assistant","content":"","contentChunks":null,"turn":0,"createdAt":"2025-11-21T10:37:02.272Z","agentId":null,"agentsApiAgentId":null,"chatId":"eacb3193-ab5f-429f-b7df-bdef13fab7a5","createdById":"8fdfd4c8-2368-4469-9a24-242bc1b60591","files":[],"id":"6a2c14de-f38f-4985-ab83-9c51ccd52406","isAcceleratedAnswer":false,"moderationCategory":null,"reaction":"neutral","references":null,"memories":null,"followups":[],"status":"active","generationStatus":"in-progress","parentId":"2f468e0a-a73f-4175-97f4-d73610fc6593","parentVersion":0,"version":0,"nextVersion":null,"prevVersion":null,"versionCount":1,"visibility":"private","model":null}}]},"meta":{"values":{"patches.0.value.createdAt":["Date"]}}}
15:{"json":{"type":"message","messageId":"6a2c14de-f38f-4985-ab83-9c51ccd52406","messageVersion":0,"patches":[{"op":"replace","path":"/references","value":[]}]}}
15:{"json":{"type":"message","messageId":"6a2c14de-f38f-4985-ab83-9c51ccd52406","messageVersion":0,"patches":[{"op":"replace","path":"/contentChunks","value":[{"type":"text","text":"Hai","_context":null}]}]},"meta":{"values":{"patches.0.value.0._context":["undefined"]}}}
15:{"json":{"type":"message","messageId":"2f468e0a-a73f-4175-97f4-d73610fc6593","messageVersion":0,"patches":[{"op":"replace","path":"/moderationCategory","value":"safe"}]}}
15:{"json":{"type":"message","messageId":"6a2c14de-f38f-4985-ab83-9c51ccd52406","messageVersion":0,"patches":[{"op":"append","path":"/contentChunks/0/text","value":","}]}}
15:{"json":{"type":"message","messageId":"6a2c14de-f38f-4985-ab83-9c51ccd52406","messageVersion":0,"patches":[{"op":"append","path":"/contentChunks/0/text","value":" sutoyoc"}]}}
15:{"json":{"type":"message","messageId":"6a2c14de-f38f-4985-ab83-9c51ccd52406","messageVersion":0,"patches":[{"op":"append","path":"/contentChunks/0/text","value":"utez! Ada"}]}}
15:{"json":{"type":"message","messageId":"6a2c14de-f38f-4985-ab83-9c51ccd52406","messageVersion":0,"patches":[{"op":"append","path":"/contentChunks/0/text","value":" yang"}]}}
15:{"json":{"type":"message","messageId":"6a2c14de-f38f-4985-ab83-9c51ccd52406","messageVersion":0,"patches":[{"op":"append","path":"/contentChunks/0/text","value":" bisa"}]}}
15:{"json":{"type":"message","messageId":"6a2c14de-f38f-4985-ab83-9c51ccd52406","messageVersion":0,"patches":[{"op":"append","path":"/contentChunks/0/text","value":" saya b"}]}}
15:{"json":{"type":"message","messageId":"6a2c14de-f38f-4985-ab83-9c51ccd52406","messageVersion":0,"patches":[{"op":"append","path":"/contentChunks/0/text","value":"antu hari"}]}}
15:{"json":{"type":"message","messageId":"6a2c14de-f38f-4985-ab83-9c51ccd52406","messageVersion":0,"patches":[{"op":"append","path":"/contentChunks/0/text","value":" ini"}]}}
15:{"json":{"type":"message","messageId":"6a2c14de-f38f-4985-ab83-9c51ccd52406","messageVersion":0,"patches":[{"op":"append","path":"/contentChunks/0/text","value":"? 😊"}]}}
15:{"json":{"type":"message","messageId":"6a2c14de-f38f-4985-ab83-9c51ccd52406","messageVersion":0,"patches":[{"op":"replace","path":"/generationStatus","value":"success"}]}}
8:null`
  return fakeStreamData.split("\n")
}
