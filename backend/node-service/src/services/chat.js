class ChatService {
  constructor(io) {
    this.io = io;
    this.messageHistory = new Map(); // roomId -> array of messages
    this.MAX_HISTORY = 100; // Maximum number of messages to keep per room
  }

  // Initialize a new room's chat
  initRoom(roomId) {
    if (!this.messageHistory.has(roomId)) {
      this.messageHistory.set(roomId, []);
    }
  }

  // Handle new message
  handleMessage(socket, { roomId, message, type = 'text' }) {
    const room = this.messageHistory.get(roomId);
    if (room) {
      const messageObj = {
        id: Date.now().toString(),
        userId: socket.userId,
        message,
        type,
        timestamp: new Date().toISOString()
      };

      // Add message to history
      room.push(messageObj);

      // Keep only the last MAX_HISTORY messages
      if (room.length > this.MAX_HISTORY) {
        room.shift();
      }

      // Broadcast to room
      this.io.to(roomId).emit('chat_message', messageObj);
    }
  }

  // Handle file sharing
  handleFileShare(socket, { roomId, fileData }) {
    const messageObj = {
      id: Date.now().toString(),
      userId: socket.userId,
      message: fileData.name,
      type: 'file',
      fileUrl: fileData.url,
      fileType: fileData.type,
      fileSize: fileData.size,
      timestamp: new Date().toISOString()
    };

    const room = this.messageHistory.get(roomId);
    if (room) {
      room.push(messageObj);
      this.io.to(roomId).emit('chat_message', messageObj);
    }
  }

  // Get chat history
  getChatHistory(roomId) {
    return this.messageHistory.get(roomId) || [];
  }

  // Handle user typing status
  handleTyping(socket, { roomId, isTyping }) {
    socket.to(roomId).emit('user_typing', {
      userId: socket.userId,
      isTyping
    });
  }

  // Clean up room when it's empty
  cleanupRoom(roomId) {
    this.messageHistory.delete(roomId);
  }

  // Handle message reaction
  handleReaction(socket, { roomId, messageId, reaction }) {
    const room = this.messageHistory.get(roomId);
    if (room) {
      const message = room.find(msg => msg.id === messageId);
      if (message) {
        if (!message.reactions) {
          message.reactions = {};
        }
        if (!message.reactions[reaction]) {
          message.reactions[reaction] = new Set();
        }

        // Toggle reaction
        const userReactions = message.reactions[reaction];
        if (userReactions.has(socket.userId)) {
          userReactions.delete(socket.userId);
        } else {
          userReactions.add(socket.userId);
        }

        // Broadcast reaction update
        this.io.to(roomId).emit('message_reaction', {
          messageId,
          reaction,
          userId: socket.userId,
          count: userReactions.size
        });
      }
    }
  }
}

module.exports = ChatService; 