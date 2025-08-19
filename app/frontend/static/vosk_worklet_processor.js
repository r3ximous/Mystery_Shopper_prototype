// AudioWorkletProcessor to forward raw audio PCM to main thread for Vosk batching
// Registers as 'vosk-audio-processor'

class VoskAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._bufferSamples = 0;
    this.maxBatchSamples = 16000; // 1s at 16k after downsample (approx.)
  }

  process(inputs, outputs, parameters) {
    // Use first channel
    const input = inputs[0];
    if (input && input[0]) {
      const channelData = input[0];
      // Copy to transferable Float32 chunk
      this.port.postMessage({ type: 'audio-chunk', samples: channelData.slice(0) });
    }
    return true; // keep alive
  }
}

registerProcessor('vosk-audio-processor', VoskAudioProcessor);
