// import Peer from "peerjs";

// export const createPeer = (): Peer => {
//   return new Peer("", {
//     host: "0.peerjs.com",
//     port: 443,
//     secure: true,
//   });
// };

import Peer from "peerjs";

export const createPeer = (customPeerId?: string): Peer => {
  return new Peer(customPeerId || "", {
    host: "0.peerjs.com",
    port: 443,
    secure: true,
  });
};