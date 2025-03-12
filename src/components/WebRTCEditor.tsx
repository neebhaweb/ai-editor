import React, { useEffect, useRef, useState } from "react";
import Peer, { DataConnection } from "peerjs";
import { createPeer } from "../utils/peer";
import {
  saveTextToDB,
  loadTextFromDB,
  saveUnsyncedChanges,
  getUnsyncedChanges,
  clearUnsyncedChanges
} from "../utils/db";
import { useStore } from "../store/useEditorStore";
import Editor from "@monaco-editor/react";

const WebRTCEditor: React.FC = () => {
  const { text, setText, users, userCount, addUser, removeUser, updateCursor } = useStore();
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connectedPeerId, setConnectedPeerId] = useState<string | null>(null);
  const peerInstance = useRef<Peer | null>(null);
  const dataChannel = useRef<DataConnection | null>(null);
  const editorRef = useRef<any>(null);
  const isRemoteUpdate = useRef(false);
  const connections = useRef<Record<string, DataConnection>>({});

  useEffect(() => {
    (async () => {
      const savedText = await loadTextFromDB();
      setText(savedText);

      const unsyncedText = await getUnsyncedChanges();
      if (unsyncedText) {
        setText(unsyncedText);
      }
    })();

    peerInstance.current = createPeer();

    peerInstance.current.on("open", (id) => {
      setPeerId(id);
    });

    peerInstance.current.on("connection", (conn) => {
      setupConnection(conn);
    });

    window.addEventListener("online", syncUnsyncedChanges);
    window.addEventListener("offline", handleOfflineMode);

    return () => {
      peerInstance.current?.disconnect();
      window.removeEventListener("online", syncUnsyncedChanges);
      window.removeEventListener("offline", handleOfflineMode);
    };
  }, []);

  const setupConnection = (conn: DataConnection) => {
    connections.current[conn.peer] = conn;
    setConnectedPeerId(conn.peer);
    addUser(conn.peer);

    conn.on("data", (data) => {
      const { type, payload } = JSON.parse(data as string);

      if (type === "textSync") {
        if (payload !== text) {
          isRemoteUpdate.current = true;
          setText(payload);
          saveTextToDB(payload);
          if (editorRef.current) {
            editorRef.current.setValue(payload);
          }
        }
      } else if (type === "cursorUpdate") {
        updateCursor(conn.peer, payload);
      }
    });

    conn.on("close", () => {
      removeUser(conn.peer);
      delete connections.current[conn.peer];
    });
  };


  const connectToPeer = () => {
    if (!peerInstance.current) return;

    const peerToConnect = prompt("Enter Peer ID to connect:");
    if (!peerToConnect || connections.current[peerToConnect]) return;

    const conn = peerInstance.current.connect(peerToConnect);
    conn.on("open", () => setupConnection(conn));
  };

  const handleTextChange = (newText: string | undefined) => {
    if (newText === undefined) return;

    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    setText(newText);
    saveTextToDB(newText);

    if (!navigator.onLine) {
      saveUnsyncedChanges(newText);
      return;
    }

    const syncData = JSON.stringify({ type: "textSync", payload: newText });
    Object.values(connections.current).forEach((conn) => {
      if (conn.open) conn.send(syncData);
    });
  };


  const syncUnsyncedChanges = async () => {
    const unsyncedText = await getUnsyncedChanges();
    if (!unsyncedText) return;

    setText(unsyncedText);
    saveTextToDB(unsyncedText);
    clearUnsyncedChanges();

    if (dataChannel.current && dataChannel.current.open) {
      const syncData = JSON.stringify({ type: "textSync", payload: unsyncedText });
      dataChannel.current.send(syncData);
    }
  };

  const handleOfflineMode = () => {
    alert("You are offline! Changes will be saved and synced when you're back online.");
  };

  const handleCursorChange = () => {
    if (!editorRef.current) return;
    const position = editorRef.current.getPosition();

    const cursorData = JSON.stringify({ type: "cursorUpdate", payload: position });
    Object.values(connections.current).forEach((conn) => {
      if (conn.open) conn.send(cursorData);
    });
  };

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <h2>WebRTC Collaborative Editor</h2>
      <p>My Peer ID: {peerId || "Generating..."}</p>
      <p>Connected Peer ID: {connectedPeerId || "Not connected"}</p>

      <div style={{display:"flex",justifyContent:"space-between", alignItems:"center"}}>
        <button onClick={connectToPeer}>Connect to Peer</button>
        <div style={{ marginTop: 20 }}>
          <h4>Active Users: {userCount}</h4>
          <ul>
            {Object.values(users).map((user) => (
              <li key={user.peerId}>
                {user.peerId} - Cursor at {JSON.stringify(user.cursorPosition)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ marginTop: 20, height: "500px" }}>
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={text}
          onChange={(value) => handleTextChange(value)}
          onMount={(editor) => {
            editorRef.current = editor;
            editor.onDidChangeCursorPosition(handleCursorChange);
          }}
        />
      </div>
    </div>
  );
};

export default WebRTCEditor;
