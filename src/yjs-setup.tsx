import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export const ydoc = new Y.Doc();

// "draft-room" = the shared room name
export const provider = new WebsocketProvider(
  "ws://localhost:1234",
  "draft-room",
  ydoc
);

// Shared text field
export const ytext = ydoc.getText("shared-text");
