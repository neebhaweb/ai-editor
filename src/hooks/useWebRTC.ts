import { useEffect, useRef, useState } from "react";
import Peer, { DataConnection } from "peerjs";
import { useStore } from "../store/useEditorStore";

export const useWebRTC = () => {
  const { setText, addUser, removeUser, updateCursor } = useStore();
  const [peerId, setPeerId] = useState<string | null>(null);
  const connections = useRef<Record<string, DataConnection>>({});
  const peerInstance = useRef<Peer | null>(null);

  useEffect(() => {
    peerInstance.current = new Peer();

    peerInstance.current.on("open", (id) => {
      setPeerId(id);
    });

    peerInstance.current.on("connection", (conn) => setupConnection(conn));

    return () => {
      peerInstance.current?.disconnect();
    };
  }, []);

  const setupConnection = (conn: DataConnection) => {
    connections.current[conn.peer] = conn;
    addUser(conn.peer);

    conn.on("data", (data) => {
      const { type, payload } = JSON.parse(data as string);
      if (type === "textSync") {
        setText(payload);
      } else if (type === "cursorUpdate") {
        updateCursor(conn.peer, payload);
      }
    });

    conn.on("close", () => {
      removeUser(conn.peer);
      delete connections.current[conn.peer];
    });
  };

  const connectToPeer = (peerToConnect: string) => {
    if (!peerInstance.current || !peerToConnect || connections.current[peerToConnect]) return;
    const conn = peerInstance.current.connect(peerToConnect);
    conn.on("open", () => setupConnection(conn));
  };

  return { peerId, connectToPeer };
};
