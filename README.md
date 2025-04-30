
# snowv-web

A fast [SNOW-V](https://eprint.iacr.org/2018/1143.pdf) stream cipher implemented in SIMD-enabled WebAssembly, ready for modern browsers and JavaScript environments.

> 🔐 Designed for speed using AVX2 and WASM SIMD. Suitable for cryptographic experimentation and educational use.

---

## 🚀 Installation

```bash
npm install snowv-web
```

> ⚠️ This library includes a `.wasm` binary. Make sure to copy `snowv-simd.wasm` to your `public/` folder or serve it appropriately in your app.

---

## 🛠 Usage

```js
import { init, setupKeyIV, generateKeystreamBlock } from 'snowv-simd';

const key = new Uint8Array([
  0x00, 0x01, 0x02, ..., 0x1F  // 32 bytes
]);

const iv = new Uint8Array([
  0xA0, 0xA1, ..., 0xAF         // 16 bytes
]);

await init();
await setupKeyIV(key, iv);

const block = await generateKeystreamBlock();
console.log(block); // Uint8Array(16)
```

You can generate multiple 128-bit keystream blocks by calling `generateKeystreamBlock()` multiple times.

---

## 📁 WASM Runtime Note

The `.wasm` file is not embedded. You **must** ensure it's served correctly in your environment. For example, in Vite:

```js
const wasmURL = new URL('./snowv-simd.wasm', import.meta.url);
const response = await fetch(wasmURL);
```

Alternatively, use `/* @vite-ignore */` to suppress Vite’s static analysis warning.

---

## 🧪 Example

See the [`examples/`](./examples) folder for a working usage demo.


---

## ⚠ Disclaimer

This library is for educational and experimental purposes. Do not use in production systems without thorough security review. Also the FSM function is not implemented fully as the AES round
is missing there. Hopefully it will be added soon.



