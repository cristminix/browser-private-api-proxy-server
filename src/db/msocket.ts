import { kvstore } from "./store";

const updateSocketConnectionIds = async (
  newSocketId: string,
  t: string = "in",
  init = false
) => {
  let connectionIds = init ? [] : await kvstore.get("connectionIds");
  if (!connectionIds) {
    connectionIds = [];
  }
  if (!init) {
    if (t === "in") {
      connectionIds.push(newSocketId);
    } else {
      // Remove element by value equal to newSocketId
      const index = connectionIds.indexOf(newSocketId);
      if (index > -1) {
        connectionIds.splice(index, 1);
      }
    }
  }
  await kvstore.put("connectionIds", connectionIds);
  console.log({ connectionIds });
};

export { updateSocketConnectionIds };
