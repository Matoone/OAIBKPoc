import { useState, useCallback } from 'react';

interface UseMicrophoneReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  error: string | null;
  stream: MediaStream | null;
}

export const useMicrophone = (): UseMicrophoneReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
        },
        video: false
      });
      
      setStream(mediaStream);
      setIsRecording(true);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError("L'accès au micro est nécessaire pour utiliser BKPOC");
      } else {
        setError("Une erreur inattendue s'est produite");
      }
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsRecording(false);
  }, [stream]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    error,
    stream
  };
};
