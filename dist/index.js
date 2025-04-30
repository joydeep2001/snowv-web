let s, x, l, i = !1;
async function a() {
  if (!i)
    try {
      const e = new URL("./snowv-simd.wasm", import.meta.url), t = await (await fetch(e)).arrayBuffer(), o = {
        wasi_snapshot_preview1: {
          proc_exit: (c) => {
            console.log(`Process exited with code ${c}`);
          },
          fd_write: (c, g, w, A) => (console.log("fd_write called"), 0),
          fd_close: () => 0,
          fd_seek: () => 0,
          fd_read: () => 0,
          environ_sizes_get: () => 0,
          environ_get: () => 0
        }
      };
      console.log("Instantiating WebAssembly module...");
      const { instance: r } = await WebAssembly.instantiate(t, {
        wasi_snapshot_preview1: o.wasi_snapshot_preview1,
        env: {}
      });
      console.log("WebAssembly module instantiated"), s = r.exports, console.log("Available exports:", Object.keys(s)), x = s.memory, l = new Uint8Array(x.buffer), i = !0, console.log("WASM module initialized successfully");
    } catch (e) {
      throw console.error("Failed to initialize WASM module:", e), e;
    }
}
async function y(e, n) {
  i || await a();
  try {
    console.log("Setting up key and IV");
    const t = s.malloc(e.length), o = s.malloc(n.length);
    for (let r = 0; r < e.length; r++)
      l[t + r] = e[r];
    for (let r = 0; r < n.length; r++)
      l[o + r] = n[r];
    console.log("Initializing global cipher"), s.init_global_cipher(t, o), s.free(t), s.free(o), console.log("Key and IV setup complete");
  } catch (t) {
    throw console.error("Error in setupKeyIV:", t), t;
  }
}
async function f() {
  i || await a();
  try {
    console.log("Generating keystream block");
    const e = s.keystream_to_bytes();
    if (!e)
      throw new Error("Failed to generate keystream - null pointer returned");
    const n = 16, t = new Uint8Array(n);
    for (let o = 0; o < n; o++)
      t[o] = l[e + o];
    return s.free(e), console.log("Keystream block generated:", Array.from(t).map((o) => o.toString(16).padStart(2, "0")).join(" ")), t;
  } catch (e) {
    throw console.error("Error in generateKeystreamBlock:", e), e;
  }
}
function u(e) {
  if (!e) return new Uint8Array(0);
  e = e.replace(/\s+/g, "").replace(/^0x/i, ""), e.length % 2 !== 0 && (e = "0" + e);
  const n = new Uint8Array(e.length / 2);
  for (let t = 0; t < e.length; t += 2)
    n[t / 2] = parseInt(e.substr(t, 2), 16);
  return n;
}
async function m() {
  try {
    await a();
    const e = new Uint8Array([
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      28,
      29,
      30,
      31
    ]), n = new Uint8Array([
      160,
      161,
      162,
      163,
      164,
      165,
      166,
      167,
      168,
      169,
      170,
      171,
      172,
      173,
      174,
      175
    ]);
    await y(e, n), console.log("Generating 5 keystream blocks...");
    for (let t = 0; t < 5; t++) {
      const o = await f();
      console.log(`Block ${t}:`, Array.from(o).map((r) => r.toString(16).padStart(2, "0")).join(" "));
    }
    console.log("Test completed successfully");
  } catch (e) {
    console.error("Test failed:", e);
  }
}
export {
  f as generateKeystreamBlock,
  u as hexToBytes,
  a as init,
  y as setupKeyIV,
  m as testSnowV
};
