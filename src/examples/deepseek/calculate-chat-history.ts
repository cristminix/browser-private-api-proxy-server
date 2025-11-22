import cuid from "cuid"
import * as path from "path"
import { loadJsonFile } from "src/global/fn/loadJsonFile"
import { loadChatHistory } from "./chat-history/loadChatHistory"
import { transformMessages } from "../../providers/deepseek/transformRequestMessages"
import { saveChatHistory } from "./chat-history/saveChatHistory"
import { getUserMessages } from "./chat-history/getUserMessages"
import { getSystemMessages } from "./chat-history/getSystemMessages"
import { generateUserPrompt } from "./chat-history/generateUserPrompt"
import { saveJsonFile } from "src/global/fn/saveJsonFile"
import fs from "fs"
const main = async () => {
  const chatId = "cmi9ur3ym00004ctd0tg68tt7"
  const chatHistoryDir = "src/examples/chat-history"
  // iter 1
  let messages = await loadJsonFile(process.cwd() + "/chat-input-test/3ldzqd/messages-00.json")
  let history: any[] = [] // await loadChatHistory(chatHistoryDir, chatId)

  let transformedMessages = transformMessages(messages)
  // console.log(transformedMessages)
  let userMessages = getUserMessages(transformedMessages, history)
  let systemMessages = getSystemMessages(transformedMessages, history)
  let userPrompt = generateUserPrompt(systemMessages, userMessages)
  // console.log(userPrompt)
  await fs.writeFileSync("userPrompt-iter-1.md", userPrompt, "utf-8")

  // append history
  history = [
    ...messages,
    {
      role: "assistant",
      content:
        'I\'ll help you fix the text display issue in your Revideo scene. Let me first examine the current code to understand the problem better.Now let me examine your current scene.tsx file to understand the exact positioning issue:Let me read your current scene.tsx file to understand the exact positioning issue:Now let me examine your actual scene.tsx file to see the current implementation:Let me read your actual scene.tsx file to understand the exact issue:Let me read your actual scene.tsx file to understand the current implementation:Let me read your scene.tsx file directly:Based on the code snippets you provided and the search results, I can see the issue. Your text component has a fixed width of 1000 pixels, but your image is 1080x1349 pixels. The text positioning needs to be adjusted relative to the image dimensions and should scale properly.\n\nHere\'s the solution to make the text display properly according to the picture size:\n\n```tsx\n<Txt\n    ref={descriptionRef}\n    text={firstPhoto.description}\n    fontSize={26}\n    fill="#DDDDDD"\n    fontFamily="Arial"\n    fontWeight={400}\n    width={900}  // Slightly less than image width for padding\n    x={0}\n    y={650}  // Position below the image (1349/2 + some padding)\n    opacity={0}\n    textAlign="center"\n    justifyContent="center"\n    lineHeight={1.6}\n    zIndex={1}\n/>\n```\n\nThe key changes:\n\n1. **Width**: Changed from 1000 to 900 pixels to fit within the 1080px image width with proper padding\n2. **Y-position**: Changed from 150 to 650 to position the text below the image (image height is 1349px, so 650 puts it roughly in the lower portion)\n\nIf you want the text to overlay on the image instead of being below it, you could position it like this:\n\n```tsx\n<Txt\n    ref={descriptionRef}\n    text={firstPhoto.description}\n    fontSize={26}\n    fill="#DDDDDD"\n    fontFamily="Arial"\n    fontWeight={400}\n    width={900}\n    x={0}\n    y={400}  // Position within the image area\n    opacity={0}\n    textAlign="center"\n    justifyContent="center"\n    lineHeight={1.6}\n    zIndex={1}\n/>\n```\n\nFor better responsiveness, you could also use percentage-based positioning:\n\n```tsx\n<Txt\n    ref={descriptionRef}\n    text={firstPhoto.description}\n    fontSize={26}\n    fill="#DDDDDD"\n    fontFamily="Arial"\n    fontWeight={400}\n    width={\'80%\'}  // 80% of container width\n    x={0}\n    y={\'70%\'}  // 70% from top\n    opacity={0}\n    textAlign="center"\n    justifyContent="center"\n    lineHeight={1.6}\n    zIndex={1}\n/>\n```\n\nChoose the positioning that best fits your design needs - either below the image, overlaying it, or using responsive percentages.',
    },
  ]
  // save history
  await saveChatHistory(chatHistoryDir, chatId, history)
  messages = await loadJsonFile(process.cwd() + "/chat-input-test/3ldzqd/messages-01.json")
  transformedMessages = transformMessages(messages)
  // console.log(transformedMessages)
  userMessages = getUserMessages(transformedMessages, history)
  systemMessages = getSystemMessages(transformedMessages, history)
  userPrompt = generateUserPrompt(systemMessages, userMessages)
  // console.log(userPrompt)
  await fs.writeFileSync("userPrompt-iter-2.md", userPrompt, "utf-8")
  console.log({ chatId })
}

main().catch((e) => console.error(e))
