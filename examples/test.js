import {
  init,
  setupKeyIV,
  generateKeystreamBlock

} from "../dist/index.js";



export async function testSnowV() {
  try {
    await init();
    
    const key = new Uint8Array([
      0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
      0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F,
      0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17,
      0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F
    ]);
    
    const iv = new Uint8Array([
      0xA0, 0xA1, 0xA2, 0xA3, 0xA4, 0xA5, 0xA6, 0xA7,
      0xA8, 0xA9, 0xAA, 0xAB, 0xAC, 0xAD, 0xAE, 0xAF
    ]);
    
    await setupKeyIV(key, iv);
    
    console.log("Generating 5 keystream blocks...");
    for (let i = 0; i < 5; i++) {
      const block = await generateKeystreamBlock();
      console.log(`Block ${i}:`, Array.from(block).map(b => b.toString(16).padStart(2, '0')).join(' '));
    }
    
    console.log("Test completed successfully");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testSnowV();