import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import { useAuth } from './AuthContext';

interface WebRTCContextType {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  startLocalStream: () => Promise<void>;
  stopLocalStream: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
}

const WebRTCContext = createContext<WebRTCContextType>({
  localStream: null,
  remoteStreams: new Map(),
  startLocalStream: async () => {},
  stopLocalStream: () => {},
  toggleAudio: () => {},
  toggleVideo: () => {},
  startScreenShare: async () => {},
  stopScreenShare: () => {},
  isAudioEnabled: false,
  isVideoEnabled: false,
  isScreenSharing: false,
});

export const useWebRTC = () => useContext(WebRTCContext);

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const { socket } = useWebSocket();
  const { user } = useAuth();

  // Start local media stream
  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      setIsAudioEnabled(true);
      setIsVideoEnabled(true);
    } catch (err) {
      console.error('Error accessing media devices:', err);
      throw err;
    }
  };

  // Stop local media stream
  const stopLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setScreenStream(stream);
      setIsScreenSharing(true);

      // Replace video track in local stream
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          localStream.removeTrack(videoTrack);
          localStream.addTrack(stream.getVideoTracks()[0]);
        }
      }

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error('Error sharing screen:', err);
      throw err;
    }
  };

  // Stop screen sharing
  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);

      // Restore video track from camera
      if (localStream) {
        startLocalStream().catch(console.error);
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopLocalStream();
      stopScreenShare();
    };
  }, []);

  return (
    <WebRTCContext.Provider
      value={{
        localStream,
        remoteStreams,
        startLocalStream,
        stopLocalStream,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
}; 