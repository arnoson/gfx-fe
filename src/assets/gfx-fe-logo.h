/**
 * Created with gfx-fe (github.com/arnoson/gfx-fe): a web based editor for gfx fonts.
 * Editor Settings: {"canvas":{"width":14,"height":13},"metrics":{"ascender":"","xHeight":"","descender":""},"baseline":17,"basedOn":{"name":"","size":17,"guides":true,"threshold":125}}
 */
const uint8_t gfx-fe-logoBitmaps[] PROGMEM = {
  0x63, 0x09, 0x45, 0x97, 0x26, 0x42, 0x14, 0x57, 0x00, 0x06, 0x60, 0x89,
  0xee, 0xe0, 0x88, 0x08, 0x60
};

const GFXglyph gfx-fe-logoGlyphs[] PROGMEM = {
  {    0,   12,   11,   16,    2,  -15 }, // 0x23 '#'
};

const GFXfont gfx-fe-logo PROGMEM = {
  (uint8_t *)gfx-fe-logoBitmaps,
  (GFXglyph *)gfx-fe-logoGlyphs,
  35, 35, 10
};
