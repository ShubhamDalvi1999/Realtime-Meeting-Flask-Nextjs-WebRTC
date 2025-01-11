class WhiteboardService {
  constructor(io) {
    this.io = io;
    this.roomStates = new Map(); // roomId -> array of drawing objects
  }

  // Initialize a new room's whiteboard
  initRoom(roomId) {
    if (!this.roomStates.has(roomId)) {
      this.roomStates.set(roomId, []);
    }
  }

  // Handle a new drawing event
  handleDraw(socket, { roomId, drawingData }) {
    const room = this.roomStates.get(roomId);
    if (room) {
      // Add the drawing to room state
      room.push({
        ...drawingData,
        userId: socket.userId,
        timestamp: Date.now()
      });

      // Broadcast to other users in the room
      socket.to(roomId).emit('whiteboard_update', {
        userId: socket.userId,
        drawingData
      });
    }
  }

  // Clear the whiteboard
  handleClear(socket, roomId) {
    if (this.roomStates.has(roomId)) {
      this.roomStates.set(roomId, []);
      socket.to(roomId).emit('whiteboard_clear', {
        userId: socket.userId
      });
    }
  }

  // Handle undo operation
  handleUndo(socket, roomId) {
    const room = this.roomStates.get(roomId);
    if (room) {
      // Remove the last drawing by this user
      const userDrawings = room.filter(drawing => drawing.userId === socket.userId);
      if (userDrawings.length > 0) {
        const lastDrawing = userDrawings[userDrawings.length - 1];
        const index = room.indexOf(lastDrawing);
        room.splice(index, 1);

        socket.to(roomId).emit('whiteboard_undo', {
          userId: socket.userId,
          drawingId: lastDrawing.id
        });
      }
    }
  }

  // Get current whiteboard state
  getState(roomId) {
    return this.roomStates.get(roomId) || [];
  }

  // Clean up room when it's empty
  cleanupRoom(roomId) {
    this.roomStates.delete(roomId);
  }

  // Handle color change
  handleColorChange(socket, { roomId, color }) {
    socket.to(roomId).emit('whiteboard_color_change', {
      userId: socket.userId,
      color
    });
  }

  // Handle brush size change
  handleBrushSizeChange(socket, { roomId, size }) {
    socket.to(roomId).emit('whiteboard_brush_size_change', {
      userId: socket.userId,
      size
    });
  }
}

module.exports = WhiteboardService; 