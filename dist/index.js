let n, c, i, l = !1;
async function f() {
  if (!l)
    try {
      const e = new URL("./snowv-simd.wasm", import.meta.url), t = await (await fetch(e)).arrayBuffer(), o = {
        wasi_snapshot_preview1: {
          proc_exit: (a) => {
            console.log(`Process exited with code ${a}`);
          },
          fd_write: (a, g, m, w) => (console.log("fd_write called"), 0),
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
      console.log("WebAssembly module instantiated"), n = r.exports, console.log("Available exports:", Object.keys(n)), c = n.memory, i = new Uint8Array(c.buffer), l = !0, console.log("WASM module initialized successfully");
    } catch (e) {
      throw console.error("Failed to initialize WASM module:", e), e;
    }
}
async function y(e, s) {
  l || await f();
  try {
    console.log("Setting up key and IV");
    const t = n.malloc(e.length), o = n.malloc(s.length);
    for (let r = 0; r < e.length; r++)
      i[t + r] = e[r];
    for (let r = 0; r < s.length; r++)
      i[o + r] = s[r];
    console.log("Initializing global cipher"), n.init_global_cipher(t, o), n.free(t), n.free(o), console.log("Key and IV setup complete");
  } catch (t) {
    throw console.error("Error in setupKeyIV:", t), t;
  }
}
async function u() {
  l || await f();
  try {
    console.log("Generating keystream block");
    const e = n.keystream_to_bytes();
    if (!e)
      throw new Error("Failed to generate keystream - null pointer returned");
    const s = 16, t = new Uint8Array(s);
    for (let o = 0; o < s; o++)
      t[o] = i[e + o];
    return n.free(e), console.log("Keystream block generated:", Array.from(t).map((o) => o.toString(16).padStart(2, "0")).join(" ")), t;
  } catch (e) {
    throw console.error("Error in generateKeystreamBlock:", e), e;
  }
}
export {
  u as generateKeystreamBlock,
  f as init,
  y as setupKeyIV
};
