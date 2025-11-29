import { createConnectFrame, parseConnectFrame } from './src/providers/gemini/createConnectFrame.js';

// Test creating and parsing a frame
const testData = JSON.stringify({ message: "Hello, world!" });
const encoder = new TextEncoder();
const decoder = new TextDecoder();

console.log("Creating frame with test data:", testData);
const frame = createConnectFrame(testData, encoder);
console.log("Frame created:", frame);

console.log("\nParsing frame...");
try {
    const result = parseConnectFrame(frame, decoder);
    console.log("Successfully parsed frame!");
    console.log("Result:", result);
} catch (error) {
    console.error("Error parsing frame:", error);
}