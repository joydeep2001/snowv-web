all:
	emcc -O3 -msimd128 -s EXPORTED_FUNCTIONS="['_main', '_keyiv_setup', '_keystream', _malloc, _free, '_keystream_to_bytes']"  src/bindings/snowv-simd.c -o public/snowv-simd.wasm