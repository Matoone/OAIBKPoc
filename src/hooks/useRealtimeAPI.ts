import { useState, useCallback, useEffect, useRef } from 'react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { Order } from '../types/order';
import { systemPrompt } from '../prompts/system';

interface UseRealtimeAPIReturn {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
  order: Order | null;
  startStreaming: (stream: MediaStream) => void;
  stopStreaming: () => void;
}

export const useRealtimeAPI = (): UseRealtimeAPIReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const clientRef = useRef<RealtimeClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const startStreaming = useCallback(async (stream: MediaStream) => {
    if (!clientRef.current || !stream) {
      console.log('No client or stream available');
      return;
    }
    
    try {
      console.log('Starting audio streaming...');
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      console.log('Audio source created');
      
      await audioContextRef.current.audioWorklet.addModule(`data:text/javascript,
        class AudioProcessor extends AudioWorkletProcessor {
          process(inputs) {
            const input = inputs[0][0];
            if (!input) return true;
            
            const audioData = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
              audioData[i] = Math.max(-32768, Math.min(32767, Math.floor(input[i] * 32768)));
            }
            
            this.port.postMessage(audioData);
            return true;
          }
        }
        registerProcessor('audio-processor', AudioProcessor);
      `);
      
      const workletNode = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
      workletNodeRef.current = workletNode;
      
      workletNode.port.onmessage = (event) => {
        if (clientRef.current) {
          clientRef.current.appendInputAudio(event.data);
        }
      };
      
      source.connect(workletNode);
      workletNode.connect(audioContextRef.current.destination);
      console.log('Audio pipeline connected');
      
    } catch (err) {
      console.error('Erreur lors du démarrage du streaming:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du streaming audio');
    }
  }, []);

  const stopStreaming = useCallback(() => {
    console.log('Stopping streaming...');
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    workletNodeRef.current = null;
  }, []);

  const connect = useCallback(async () => {
    try {
      console.log('Connecting to Realtime API...');
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        throw new Error('API key is not configured');
      }

      clientRef.current = new RealtimeClient({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowAPIKeyInBrowser: true,
      });

      // Configuration du client avec server_vad
      clientRef.current.updateSession({
        instructions: systemPrompt,
        turn_detection: {
          type: 'server_vad',
          prefix_padding_ms: 500,
          silence_duration_ms: 500,
          threshold: 0.3
        },
        input_audio_transcription: { model: 'whisper-1' },
      });

      // Événements de log détaillés
      clientRef.current.on('realtime.event', ({ time, source, event }) => {
        console.log(`[${time}] ${source} event:`, event);
        if (event.type === 'input_audio_buffer.speech_started') {
          console.log('Speech detected!');
        } else if (event.type === 'input_audio_buffer.speech_stopped') {
          console.log('Speech ended!');
        } else if (event.type === 'response.text.delta') {
          console.log('Text response:', event.delta);
        } else if (event.type === 'response.done') {
          console.log('Response complete:', event);
        }
      });

      // Gestion de la conversation
      clientRef.current.on('conversation.updated', ({ item, delta }) => {
        console.log('Conversation updated:', { item, delta });
      });

      clientRef.current.on('conversation.item.appended', ({ item }) => {
        console.log('New conversation item:', item);
      });

      clientRef.current.on('conversation.item.completed', ({ item }) => {
        console.log('Conversation item completed:', item);
      });

      clientRef.current.on('conversation.interrupted', () => {
        console.log('Conversation interrupted');
      });

      clientRef.current.on('error', (event) => {
        console.error('Realtime API error:', event);
        setError(`Erreur de l'API: ${event.message}`);
      });

      // Tool pour mettre à jour la commande
      clientRef.current.addTool({
        name: 'update_order',
        description: 'Met à jour la commande actuelle',
        parameters: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                  quantity: { type: 'number' },
                  category: { 
                    type: 'string',
                    enum: [
                      'Menus',
                      'Burgers',
                      'Wraps & Salades',
                      'Snacks',
                      'Menus enfants',
                      'Petites faims',
                      'Desserts',
                      'Sauces',
                      'Boissons'
                    ]
                  }
                },
                required: ['name', 'price', 'quantity', 'category']
              }
            },
            total: { type: 'number' }
          },
          required: ['items', 'total']
        }
      }, (params) => {
        console.log('Tool called with params:', params);
        setOrder(params as Order);
      });

      await clientRef.current.connect();
      console.log('Connected to Realtime API');
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('Connection error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue');
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    console.log('Disconnecting...');
    stopStreaming();
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setIsConnected(false);
  }, [stopStreaming]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
    error,
    order,
    startStreaming,
    stopStreaming
  };
};