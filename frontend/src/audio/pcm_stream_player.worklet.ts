// AudioWorkletProcessor for streaming 16-bit PCM (little-endian) at the AudioContext sample rate.
// Receives ArrayBuffer chunks of Int16 PCM via port messages and plays them sequentially.

class PcmStreamPlayerProcessor extends AudioWorkletProcessor {
  private buffer: Float32Array;
  private readIdx = 0;
  private writeIdx = 0;
  private available = 0;

  constructor() {
    super();
    // ~4 seconds of audio at 24kHz (configurable)
    const seconds = 4;
    const capacity = Math.max(24000, Math.floor(sampleRate * seconds));
    this.buffer = new Float32Array(capacity);

    this.port.onmessage = (event) => {
      const msg = event.data;
      if (!msg) return;

      if (msg.type === "reset") {
        this.readIdx = 0;
        this.writeIdx = 0;
        this.available = 0;
        return;
      }

      if (msg.type === "pcm16" && msg.pcm instanceof ArrayBuffer) {
        const int16 = new Int16Array(msg.pcm);
        for (let i = 0; i < int16.length; i++) {
          const s = int16[i] / 32768;
          this.pushSample(s);
        }
      }
    };
  }

  private pushSample(sample: number) {
    if (this.available >= this.buffer.length) {
      // Drop oldest sample to make room (prevents runaway latency)
      this.readIdx = (this.readIdx + 1) % this.buffer.length;
      this.available -= 1;
    }
    this.buffer[this.writeIdx] = sample;
    this.writeIdx = (this.writeIdx + 1) % this.buffer.length;
    this.available += 1;
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]) {
    const out = outputs[0];
    if (!out || out.length === 0) return true;

    const ch0 = out[0];
    for (let i = 0; i < ch0.length; i++) {
      if (this.available > 0) {
        ch0[i] = this.buffer[this.readIdx];
        this.readIdx = (this.readIdx + 1) % this.buffer.length;
        this.available -= 1;
      } else {
        ch0[i] = 0;
      }
    }

    // Mirror to other channels if any
    for (let c = 1; c < out.length; c++) {
      out[c].set(ch0);
    }

    return true;
  }
}

registerProcessor("pcm-stream-player", PcmStreamPlayerProcessor);

