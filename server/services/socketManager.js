class SocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }
  initialize(server) {
    console.log('ℹ️ Socket.IO is configured and ready. Install socket.io package and uncomment to enable.');
  }
  emitToUser(userId, event, data) {
    if (!this.io) return;
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) this.io.to(socketId).emit(event, data);
  }
  emitToRoom(room, event, data) {
    if (!this.io) return;
    this.io.to(room).emit(event, data);
  }
  getConnectedUsers() {
    return this.connectedUsers;
  }
}
module.exports = new SocketManager();
