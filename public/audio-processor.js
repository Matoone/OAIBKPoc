class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4800; // 0.2s @ 24kHz
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.sampleCount = 0;
  }

  calculateRMS(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true;

    // Vérifier le format audio
    if (this.sampleCount === 0) {
      console.log('Audio format check:', {
        inputLength: input.length,
        sampleRate: sampleRate, // variable globale disponible dans AudioWorklet
        channelData: inputs[0].length, // nombre de canaux
        firstSample: input[0], // vérifier que c'est bien un Float32
      });
    }
    this.sampleCount += input.length;

    // Copier les nouveaux échantillons dans le buffer
    for (let i = 0; i < input.length; i++) {
      this.buffer[this.bufferIndex] = input[i];
      this.bufferIndex++;

      // Quand le buffer est plein, le traiter
      if (this.bufferIndex === this.bufferSize) {
        // Calculer le RMS pour ce chunk
        const rms = this.calculateRMS(this.buffer);
        
        // Convertir en Int16Array
        const audioData = new Int16Array(this.bufferSize);
        for (let j = 0; j < this.bufferSize; j++) {
          audioData[j] = Math.max(-32768, Math.min(32767, Math.floor(this.buffer[j] * 32768)));
        }

        // Envoyer les données avec les métriques audio
        this.port.postMessage({
          audio: audioData,
          metrics: {
            rms,
            peak: Math.max(...this.buffer.map(Math.abs)),
            sampleCount: this.sampleCount,
          }
        });

        // Si le volume est très faible, loguer un avertissement toutes les 50 frames
        if (rms < 0.001 && this.sampleCount % (this.bufferSize * 50) === 0) {
          console.warn('Very low audio volume detected:', rms);
        }

        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);