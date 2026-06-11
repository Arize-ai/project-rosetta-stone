// AudioWorklet that downsamples the mic input from the AudioContext's
// native rate (typically 48 kHz) to 24 kHz mono and emits Int16 PCM
// chunks to the main thread via `port.postMessage`.
//
// Loaded via:
//   await ctx.audioWorklet.addModule("/audio-worklets/pcm16-encoder.js");
//   const node = new AudioWorkletNode(ctx, "pcm16-encoder");
//   node.port.onmessage = (e) => { /* e.data is an Int16Array */ };

class PCM16Encoder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 24000;
    this.inputRate = sampleRate; // global, set by the AudioContext
    this.ratio = this.inputRate / this.targetRate;
    this.cursor = 0;
    this.carry = []; // leftover samples between process() calls
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel) return true;

    // Concatenate carry + new samples
    const all = new Float32Array(this.carry.length + channel.length);
    all.set(this.carry, 0);
    all.set(channel, this.carry.length);

    // Downsample by linear sampling with the ratio
    const out = [];
    let idx = this.cursor;
    while (idx + 1 < all.length) {
      const i = Math.floor(idx);
      const frac = idx - i;
      const sample = all[i] * (1 - frac) + all[i + 1] * frac;
      // clamp + Int16
      const s = Math.max(-1, Math.min(1, sample));
      out.push(s < 0 ? s * 0x8000 : s * 0x7fff);
      idx += this.ratio;
    }
    this.cursor = idx - Math.floor(idx);
    // Keep last samples needed for interpolation continuation
    const consumed = Math.floor(idx);
    this.carry = Array.from(all.slice(Math.max(0, consumed - 1)));

    if (out.length > 0) {
      const pcm = new Int16Array(out);
      // Transfer the underlying buffer so we don't copy
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }
    return true;
  }
}

registerProcessor("pcm16-encoder", PCM16Encoder);
