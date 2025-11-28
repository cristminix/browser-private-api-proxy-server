import { marked } from "marked"

/**
 * Detects and cleans invalid markdown code blocks in content using marked library
 * @param content The content to check for invalid markdown code blocks
 * @returns Cleaned content with invalid trailing backticks removed
 */
export const cleanInvalidMarkdownCodeBlocks = (
  content: string,
  chunk
): string => {
  // Check if content ends with '```' but doesn't contain a proper closing '\n```'
  // This indicates an incomplete/invalid markdown code block
  // Use marked to verify if this is indeed an invalid markdown
  // console.log(chunk)
  try {
    // Try to parse the content with marked
    const tokens = marked.lexer(content)

    // Check if there's an unclosed code block at the end
    const lastToken = tokens[tokens.length - 1]
    if (lastToken && lastToken.type === "code") {
      // This is indeed an unclosed code block, remove the trailing backticks
      if (chunk.finish_reason !== "done") {
        if (content.endsWith("```")) {
          {
            return content.slice(0, -3).trim()
          }
        }
      }
    }
  } catch (error) {
    // If marked parsing fails, fall back to simple detection
    console.warn(
      "Marked parsing failed, falling back to simple detection:",
      error
    )
    return content.slice(0, -3)
  }
  return content
}
