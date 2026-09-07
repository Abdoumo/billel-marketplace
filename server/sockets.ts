import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import prisma from "./db";

export function initSockets(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("Client connected via WebSocket:", socket.id);

    // Join a Deal Room or Auction Room
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Deal Room Messages
    socket.on("send-message", (data) => {
      const { roomId, userId, content, user } = data;
      
      // In a real app, save message to DB here before broadcasting.
      io.to(roomId).emit("new-message", {
        userId,
        content,
        user,
        timestamp: new Date().toISOString(),
      });
    });

    // Live Auction Bids
    socket.on("place-bid", (data) => {
      const { listingId, userId, amount, user } = data;
      
      io.to(`auction_${listingId}`).emit("new-bid", {
        listingId,
        userId,
        amount,
        user,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}
