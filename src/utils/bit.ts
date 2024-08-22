export const getBit = (
  buffer: Uint8Array,
  byteIndex: number,
  bitIndex: number,
) => ((buffer[byteIndex] & (1 << bitIndex)) === 0 ? 0 : 1)

export function setBit(
  buffer: Uint8Array,
  byteIndex: number,
  bitIndex: number,
  value: boolean,
) {
  if (value) buffer[byteIndex] &= ~(1 << bitIndex)
  else buffer[byteIndex] |= 1 << bitIndex
}
