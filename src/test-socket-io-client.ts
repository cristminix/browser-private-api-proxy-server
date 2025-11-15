import { io } from "socket.io-client";

const initSocket = () => {
  // Create a Socket.IO connection to the server with specific options to handle server refused scenarios
  const socket = io("http://localhost:4001", {
    // Disable automatic reconnection to allow the program to exit when server is not available
    autoConnect: true,
    reconnection: false,  // Disable reconnection attempts
    timeout: 5000,        // 5 second timeout for connection attempts
    transports: ['websocket']  // Use only websocket transport
  });

  socket.on("connect", () => {
    console.log("Connected to Socket.IO server");

    // Send a test API request
    const testMessage = {
      type: "api_request",
      requestId: "test-123",
      payload: {
        api: "browser.storage.local.get",
        data: { key: "test" },
      },
    };

    console.log("Sending test message:", testMessage);
    socket.emit("message", testMessage);

    // Also send a ping
    setTimeout(() => {
      socket.emit("message", { type: "ping" });
    }, 1000);
  });

  socket.on("message", (data) => {
    console.log("Received message from server:", data);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket.IO connection closed:", reason);
    // Exit the process after disconnection
    process.exit(0);
  });

  socket.on("connect_error", (error) => {
    console.error("Failed to connect to Socket.IO server:", error.message);
    console.log("Exiting program as server is not available...");
    process.exit(1);  // Exit with error code when connection fails
  });

  socket.on("error", (error) => {
    console.error("Socket.IO error:", error);
  });

  return socket;  // Return the socket instance for potential cleanup
};

const main = async () => {
  const socket = initSocket();

  // Set a timeout to exit the program if connection is not established within a reasonable time
  setTimeout(() => {
    if (!socket.connected) {
      console.log("Connection timeout: Server not available, exiting...");
      process.exit(1);
    }
  }, 6000); // Slightly longer than the socket timeout
};
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
