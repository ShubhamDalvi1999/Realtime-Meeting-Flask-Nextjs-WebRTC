class WebRTCSignaling {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> Set of user IDs
  }

  handleJoin(socket, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    const room = this.rooms.get(roomId);
    room.add(socket.userId);

    // Notify existing users in the room about the new peer
    socket.to(roomId).emit('peer_join', {
      userId: socket.userId
    });

    // Send the list of existing peers to the new user
    socket.emit('room_peers', {
      peers: Array.from(room)
    });
  }

  handleLeave(socket, roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(socket.userId);
      
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }

      // Notify remaining peers about the departure
      socket.to(roomId).emit('peer_leave', {
        userId: socket.userId
      });
    }
  }

  handleOffer(socket, { targetUserId, offer }) {
    socket.to(targetUserId).emit('rtc_offer', {
      userId: socket.userId,
      offer
    });
  }

  handleAnswer(socket, { targetUserId, answer }) {
    socket.to(targetUserId).emit('rtc_answer', {
      userId: socket.userId,
      answer
    });
  }

  handleIceCandidate(socket, { targetUserId, candidate }) {
    socket.to(targetUserId).emit('ice_candidate', {
      userId: socket.userId,
      candidate
    });
  }

  // Handle media stream events
  handleMediaStreamStart(socket, { roomId, type }) {
    socket.to(roomId).emit('media_stream_start', {
      userId: socket.userId,
      type // 'video', 'audio', or 'screen'
    });
  }

  handleMediaStreamStop(socket, { roomId, type }) {
    socket.to(roomId).emit('media_stream_stop', {
      userId: socket.userId,
      type
    });
  }

  // Handle connection state changes
  handleConnectionStateChange(socket, { roomId, state }) {
    socket.to(roomId).emit('peer_connection_state', {
      userId: socket.userId,
      state
    });
  }
}

module.exports = WebRTCSignaling; 