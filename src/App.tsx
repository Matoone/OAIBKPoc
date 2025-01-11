import { Box, Button, Container, Typography } from '@mui/material';
import { RealtimeClient } from '@openai/realtime-api-beta';
import React, { useCallback, useRef, useState } from 'react';
import { systemPrompt } from './prompts/system';

class AudioPlayer {
  private audioContext: AudioContext;
  private queue: Int16Array[] = [];
  private isPlaying = false;

  constructor(sampleRate: number) {
    this.audioContext = new AudioContext({ sampleRate });
  }

  addToQueue(audioData: Int16Array) {
    console.log('Received audio data:', {
      length: audioData.length,
      min: Math.min(...audioData),
      max: Math.max(...audioData),
      sampleRate: this.audioContext.sampleRate,
    });
    this.queue.push(audioData);
    this.playNext();
  }

  private async playNext() {
    if (this.isPlaying || this.queue.length === 0) return;

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      // Convertir Int16Array en Float32Array
      const float32Array = new Float32Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        float32Array[i] = audioData[i] / 0x7fff;
      }

      // Créer le buffer audio directement
      const audioBuffer = this.audioContext.createBuffer(
        1, // mono
        float32Array.length,
        this.audioContext.sampleRate,
      );

      // Copier les données
      audioBuffer.copyToChannel(float32Array, 0);

      // Créer et jouer la source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      source.onended = () => {
        this.isPlaying = false;
        this.playNext();
      };

      source.start(0);
    } catch (err) {
      console.error('Error playing audio:', err);
      this.isPlaying = false;
      this.playNext();
    }
  }

  async initializeAudioProcessor(stream: MediaStream) {
    await this.audioContext.audioWorklet.addModule('/audio-processor.js');
    const source = this.audioContext.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(this.audioContext, 'audio-processor');
    return { source, node };
  }

  close() {
    this.queue = [];
    this.isPlaying = false;
    this.audioContext.close();
  }
}

const App: React.FC = () => {
  const [client, setClient] = useState<RealtimeClient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastAudioMetrics, setLastAudioMetrics] = useState<{
    rms: number;
    peak: number;
  } | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  const startConversation = useCallback(async () => {
    try {
      console.log('Starting conversation...');

      // Initialiser l'AudioPlayer
      audioPlayerRef.current = new AudioPlayer(24000);

      // Configuration de l'entrée audio
      console.log('Initializing audio input...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      const realtimeClient = new RealtimeClient({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowAPIKeyInBrowser: true,
      });

      // Configuration détaillée de la session
      realtimeClient.updateSession({
        instructions: systemPrompt,
        voice: 'alloy',
        output_audio_format: 'pcm16',
        turn_detection: {
          type: 'server_vad',
          prefix_padding_ms: 100,
          silence_duration_ms: 600,
          threshold: 0.5,
        },
        input_audio_transcription: { model: 'whisper-1' },
      });

      // Event logging with categories
      realtimeClient.on('realtime.event', ({ time, source, event }) => {
        const timestamp = new Date(time).toLocaleTimeString();

        if (event.type === 'response.audio.delta') {
          console.log(
            `[${timestamp}] AUDIO DELTA: Length=${event.delta?.length || 0}`,
          );
          if (event.delta && audioPlayerRef.current) {
            if (event.type === 'response.audio.delta') {
              if (event.delta && audioPlayerRef.current) {
                // Decoder les données base64 en Int16Array
                const binaryStr = atob(event.delta);
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                  bytes[i] = binaryStr.charCodeAt(i);
                }
                const audioData = new Int16Array(bytes.buffer);
                audioPlayerRef.current.addToQueue(audioData);
              }
            }
            //audioPlayerRef.current.addToQueue(event.delta);
          }
        } else {
          console.log(`[${timestamp}] ${source}: ${event.type}`, event);
        }
      });

      // Conversation management
      realtimeClient.on('conversation.item.appended', ({ item }) => {
        console.log('New conversation item:', item);
      });

      realtimeClient.on('conversation.item.completed', ({ item }) => {
        console.log('Completed conversation item:', item);
      });

      // Connection
      console.log('Connecting to Realtime API...');
      await realtimeClient.connect();
      console.log('Successfully connected to Realtime API');

      // Initialisation du processeur audio
      const { source, node } =
        await audioPlayerRef.current.initializeAudioProcessor(stream);

      // Configuration audio
      node.port.onmessage = (event) => {
        if (realtimeClient && event.data.audio) {
          realtimeClient.appendInputAudio(event.data.audio);
          if (event.data.metrics) {
            setLastAudioMetrics(event.data.metrics);
          }
        }
      };

      source.connect(node);
      console.log('Audio pipeline initialized');

      setClient(realtimeClient);
      setIsConnected(true);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');

      if (audioPlayerRef.current) {
        audioPlayerRef.current.close();
        audioPlayerRef.current = null;
      }
      if (client) {
        client.disconnect();
        setClient(null);
      }
      setIsConnected(false);
      setLastAudioMetrics(null);
    }
  }, [client]);

  const disconnect = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.close();
      audioPlayerRef.current = null;
    }
    if (client) {
      client.disconnect();
      setClient(null);
    }
    setIsConnected(false);
    setLastAudioMetrics(null);
  }, [client]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Voice Chat
        </Typography>

        <Button
          variant="contained"
          onClick={isConnected ? disconnect : startConversation}
          sx={{ mt: 2 }}
        >
          {isConnected ? 'Déconnecter' : 'Commencer'}
        </Button>

        {lastAudioMetrics && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Volume: {(lastAudioMetrics.rms * 100).toFixed(1)}% (Peak:{' '}
            {(lastAudioMetrics.peak * 100).toFixed(1)}%)
          </Typography>
        )}

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default App;
