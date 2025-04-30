import wasmUrl from './snowv-simd.wasm?url';

let wasmExports;
let memory;
let HEAP8;
let isInitialized = false;

export async function init() {
  if (isInitialized) return;
  
  try {
    
    const response = await fetch(wasmUrl);
    const buffer = await response.arrayBuffer();
    
    const wasi = {
      wasi_snapshot_preview1: {
        proc_exit: (code) => { console.log(`Process exited with code ${code}`); },
        fd_write: (fd, iovs, iovsLen, written) => {
          // Minimal implementation for console output
          console.log("fd_write called");
          return 0;
        },
        fd_close: () => 0,
        fd_seek: () => 0,
        fd_read: () => 0,
        environ_sizes_get: () => 0,
        environ_get: () => 0
      }
    };
    
    console.log("Instantiating WebAssembly module...");
    const { instance } = await WebAssembly.instantiate(buffer, {
      wasi_snapshot_preview1: wasi.wasi_snapshot_preview1,
      env: {}
    });
    
    console.log("WebAssembly module instantiated");
    wasmExports = instance.exports;
    console.log("Available exports:", Object.keys(wasmExports));
    
    memory = wasmExports.memory;
    HEAP8 = new Uint8Array(memory.buffer);
    
    isInitialized = true;
    console.log("WASM module initialized successfully");
  } catch (error) {
    console.error("Failed to initialize WASM module:", error);
    throw error;
  }
}

export async function setupKeyIV(key, iv) {
  if (!isInitialized) await init();
  
  try {
    console.log("Setting up key and IV");
    // Allocate memory for key and IV
    const keyPtr = wasmExports.malloc(key.length);
    const ivPtr = wasmExports.malloc(iv.length);
    
    // Copy key and IV to WebAssembly memory
    for (let i = 0; i < key.length; i++) {
      HEAP8[keyPtr + i] = key[i];
    }
    
    for (let i = 0; i < iv.length; i++) {
      HEAP8[ivPtr + i] = iv[i];
    }
    
    console.log("Initializing global cipher");
    // Initialize the global cipher state
    wasmExports.init_global_cipher(keyPtr, ivPtr);
    
    // Free allocated memory
    wasmExports.free(keyPtr);
    wasmExports.free(ivPtr);
    
    console.log("Key and IV setup complete");
  } catch (error) {
    console.error("Error in setupKeyIV:", error);
    throw error;
  }
}

export async function generateKeystreamBlock() {
  if (!isInitialized) await init();
  
  try {
    console.log("Generating keystream block");
    // Call the C function that handles the conversion from v128_t to bytes
    const outputPtr = wasmExports.keystream_to_bytes();
    
    if (!outputPtr) {
      throw new Error("Failed to generate keystream - null pointer returned");
    }
    
    // Copy the 16-byte keystream block
    const blockSize = 16; // 128 bits = 16 bytes
    const result = new Uint8Array(blockSize);
    
    for (let i = 0; i < blockSize; i++) {
      result[i] = HEAP8[outputPtr + i];
    }
    
    // Free the memory allocated by keystream_to_bytes
    wasmExports.free(outputPtr);
    
    console.log("Keystream block generated:", Array.from(result).map(b => b.toString(16).padStart(2, '0')).join(' '));
    return result;
  } catch (error) {
    console.error("Error in generateKeystreamBlock:", error);
    throw error;
  }
}



