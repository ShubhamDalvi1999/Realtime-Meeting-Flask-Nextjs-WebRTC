import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useWebSocket } from './WebSocketContext';

interface DrawingObject {
  type: string;
  options: fabric.IObjectOptions & {
    path?: any[];  // Add path property for path objects
  };
}

interface WhiteboardContextType {
  canvas: fabric.Canvas | null;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  currentBrushSize: number;
  setCurrentBrushSize: (size: number) => void;
  clearCanvas: () => void;
}

const WhiteboardContext = createContext<WhiteboardContextType | undefined>(undefined);

export function WhiteboardProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useWebSocket();
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentBrushSize, setCurrentBrushSize] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingHistory = useRef<DrawingObject[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const newCanvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#ffffff'
    });

    newCanvas.freeDrawingBrush.color = currentColor;
    newCanvas.freeDrawingBrush.width = currentBrushSize;

    setCanvas(newCanvas);

    // Handle window resize
    const handleResize = () => {
      newCanvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      newCanvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!canvas || !socket) return;

    // Handle remote drawing events
    socket.on('whiteboard_update', ({ userId, drawingData }) => {
      const path = new fabric.Path(drawingData.path);
      path.set(drawingData.options);
      canvas.add(path);
      canvas.renderAll();
    });

    socket.on('whiteboard_clear', () => {
      canvas.clear();
      drawingHistory.current = [];
    });

    socket.on('whiteboard_undo', ({ userId }) => {
      if (drawingHistory.current.length > 0) {
        const objects = canvas.getObjects();
        if (objects.length > 0) {
          canvas.remove(objects[objects.length - 1]);
          drawingHistory.current.pop();
        }
      }
    });

    // Handle local drawing events
    canvas.on('path:created', (e: any) => {
      const path = e.path;
      const pathData: DrawingObject = {
        type: 'path',
        options: {
          stroke: path.stroke,
          strokeWidth: path.strokeWidth,
          path: path.path
        }
      };

      drawingHistory.current.push(pathData);

      socket.emit('whiteboard_draw', {
        drawingData: pathData
      });
    });

    canvas.on('mouse:down', () => setIsDrawing(true));
    canvas.on('mouse:up', () => setIsDrawing(false));

    return () => {
      socket.off('whiteboard_update');
      socket.off('whiteboard_clear');
      socket.off('whiteboard_undo');
    };
  }, [canvas, socket]);

  const setColor = (color: string) => {
    if (canvas) {
      setCurrentColor(color);
      canvas.freeDrawingBrush.color = color;
      socket?.emit('whiteboard_color_change', { color });
    }
  };

  const setBrushSize = (size: number) => {
    if (canvas) {
      setCurrentBrushSize(size);
      canvas.freeDrawingBrush.width = size;
      socket?.emit('whiteboard_brush_size_change', { size });
    }
  };

  const clearCanvas = () => {
    if (canvas) {
      canvas.clear();
      socket?.emit('canvas_clear');
    }
  };

  const undo = () => {
    if (canvas && drawingHistory.current.length > 0) {
      const objects = canvas.getObjects();
      if (objects.length > 0) {
        canvas.remove(objects[objects.length - 1]);
        drawingHistory.current.pop();
        socket?.emit('whiteboard_undo');
      }
    }
  };

  return (
    <WhiteboardContext.Provider
      value={{
        canvas,
        currentColor,
        setCurrentColor,
        currentBrushSize,
        setCurrentBrushSize,
        clearCanvas
      }}
    >
      <canvas ref={canvasRef} style={{ border: '1px solid #ccc' }} />
      {children}
    </WhiteboardContext.Provider>
  );
}

export function useWhiteboard() {
  const context = useContext(WhiteboardContext);
  if (context === undefined) {
    throw new Error('useWhiteboard must be used within a WhiteboardProvider');
  }
  return context;
} 