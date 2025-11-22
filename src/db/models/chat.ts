import { kvstore } from "../store"

export async function getChatByChatId(id: string) {
  return await kvstore.get(`chat_${id}`)
}
export async function getChatByChecksum(checksum: string) {
  return await kvstore.get(`chat_checksum_${checksum}`)
}
export async function saveChat(chat: any) {
  const { id } = chat
  return await kvstore.put(`chat_checksum_${id}`, chat)
}
export async function updateChat(id: string, chat: any) {
  return await kvstore.put(`chat_${id}`, chat)
}
