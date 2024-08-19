export const getBit = (
  buffer: Uint8Array,
  byteIndex: number,
  bitIndex: number,
) => ((buffer[byteIndex] & (1 << bitIndex)) === 0 ? 0 : 1)
