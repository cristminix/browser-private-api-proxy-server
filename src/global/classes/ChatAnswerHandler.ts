import { EventEmitter } from "events"
class ChatAnswerHandler extends EventEmitter {
  static instance: ChatAnswerHandler | null = null
  constructor() {
    super()
  }
  static getInstance() {
    if (!ChatAnswerHandler.instance) {
      ChatAnswerHandler.instance = new ChatAnswerHandler()
    }

    return ChatAnswerHandler.instance
  }
  waitForAnswer(socketId: string, requestId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.removeListener(`answer_${socketId}_${requestId}`, answerHandler)
        reject(new Error("Timeout"))
      }, 60000)

      const answerHandler = (data: any) => {
        clearTimeout(timeout)
        resolve(data)
      }

      this.once(`answer_${socketId}_${requestId}`, answerHandler)
    })
  }
  waitForAnswerKey(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.removeListener(`${key}`, answerHandler)
        reject(new Error("Timeout"))
      }, 60000)

      const answerHandler = (data: any) => {
        clearTimeout(timeout)
        resolve(data)
      }

      this.once(`${key}`, answerHandler)
    })
  }
  notifyAnswer(socketId: string, requestId: string, data: any) {
    const key = `answer_${socketId}_${requestId}`
    console.log("notify answer key:" + key)
    this.emit(key, data)
  }
  notifyAnswerKey(key: string, data: any) {
    this.emit(`${key}`, data)
  }
}
export { ChatAnswerHandler }
