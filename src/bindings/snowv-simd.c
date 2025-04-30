#include <stdint.h>
#include <string.h>
#include <wasm_simd128.h>
#include <stdio.h>
#include <emscripten.h>
#include <stdlib.h>  

typedef struct {
    v128_t _mul;   
    v128_t _inv;    
    v128_t zero128;
    v128_t hi, lo;
    v128_t R1, R2, R3;
} SnowV128;

static inline v128_t vpset16(int16_t value) {
    return wasm_i16x8_splat(value);
}

void snowV128_init(SnowV128 *cipher) {
   
    cipher->_mul = wasm_v128_or(wasm_i16x8_splat(0x990f), wasm_i16x8_splat(0xc963));
    cipher->_inv = wasm_v128_or(wasm_i16x8_splat((int16_t)0xcc87), wasm_i16x8_splat((int16_t)0xe4b1));
    cipher->zero128 = wasm_i32x4_splat(0);
    
    // Initialize other fields to avoid undefined behavior
    cipher->hi = cipher->lo = wasm_i32x4_splat(0);
    cipher->R1 = cipher->R2 = cipher->R3 = wasm_i32x4_splat(0);
}

static inline v128_t mul_x(v128_t s, v128_t _mul) {
    v128_t shifted = wasm_i16x8_shl(s, 1);
    v128_t highbit = wasm_i16x8_shr(s, 15);
    v128_t masked = wasm_v128_and(highbit, _mul);
    return wasm_v128_xor(masked, shifted);
}

static inline v128_t mul_x_inv(v128_t s, v128_t _inv) {
    v128_t shifted = wasm_i16x8_shr(s, 1);
    v128_t sign = wasm_i16x8_shl(s, 15);
    v128_t signed_val = wasm_v128_and(sign, _inv);
    return wasm_v128_xor(signed_val, shifted);
}

void lfsr_update(SnowV128 *cipher) {
    v128_t hi_old = cipher->hi;
    v128_t shifted = (v128_t)wasm_i8x16_shuffle(
        cipher->hi, cipher->lo,
        2, 3, 4, 5, 6, 7, 8, 9,
        10, 11, 12, 13, 14, 15, 0, 1
    );
    v128_t shuffled = (v128_t)wasm_i8x16_shuffle(
        cipher->lo, cipher->lo,
        8, 9, 10, 11, 12, 13, 14, 15,
        0, 1, 2, 3, 4, 5, 6, 7
    );
    v128_t term1 = mul_x_inv(cipher->hi, cipher->_inv);
    v128_t term2 = mul_x(cipher->lo, cipher->_mul);
    v128_t xor_result = wasm_v128_xor(term1, term2);
    v128_t intermediate = wasm_v128_xor(shifted, shuffled);
    cipher->hi = wasm_v128_xor(intermediate, xor_result);
    cipher->lo = hi_old;
}

void fsm_update(SnowV128 *cipher) {
    v128_t T2 = cipher->lo;
    v128_t newR1 = wasm_i32x4_add(cipher->R2, wasm_v128_xor(cipher->R3, T2));
    cipher->R3 = wasm_i32x4_add(cipher->R2, cipher->zero128);
    cipher->R2 = wasm_i32x4_add(cipher->R1, cipher->zero128);
    cipher->R1 = newR1;
}

EMSCRIPTEN_KEEPALIVE
v128_t keystream(SnowV128 *cipher) {
    
    uint8_t debug[16];
    wasm_v128_store(debug, cipher->hi);
    
    v128_t z = wasm_v128_xor(cipher->R2, wasm_i32x4_add(cipher->R1, cipher->hi));
    fsm_update(cipher);
    lfsr_update(cipher);
    return z;
}

EMSCRIPTEN_KEEPALIVE
void keyiv_setup(SnowV128 *cipher, const uint8_t *key, const uint8_t *iv) {
        
    // Initialize the cipher structure first
    snowV128_init(cipher);
    
    cipher->hi = wasm_v128_load(key);
    cipher->lo = wasm_v128_load(iv);
    cipher->R1 = cipher->R2 = cipher->R3 = wasm_i32x4_splat(0);
    
    // Perform initialization rounds
    for (int i = 0; i < 15; ++i) {
        v128_t ks = keystream(cipher);
        cipher->hi = wasm_v128_xor(cipher->hi, ks);
    }
    cipher->R1 = wasm_v128_xor(cipher->R1, wasm_v128_load(key));
    
    v128_t ks = keystream(cipher);
    cipher->hi = wasm_v128_xor(cipher->hi, ks);
    cipher->R1 = wasm_v128_xor(cipher->R1, wasm_v128_load(key + 16));
}

// Global cipher state - properly allocated and initialized
SnowV128 global_cipher;
SnowV128 *global_cipher_state = NULL;

EMSCRIPTEN_KEEPALIVE
void init_global_cipher(const uint8_t *key, const uint8_t *iv) {
    // Use the stack-allocated global cipher
    global_cipher_state = &global_cipher;
    
    // Initialize the global cipher
    snowV128_init(global_cipher_state);
    keyiv_setup(global_cipher_state, key, iv);
    
    //printf("Global cipher initialized\n");
}

EMSCRIPTEN_KEEPALIVE
uint8_t* keystream_to_bytes() {
    if (global_cipher_state == NULL) {
        return NULL;
    }
    
    // Allocate memory for the result (16 bytes)
    uint8_t* result = (uint8_t*)malloc(16);
    if (result == NULL) {
        return NULL;
    }
    
    v128_t keystream_block = keystream(global_cipher_state);
    wasm_v128_store(result, keystream_block);
    
    return result;
}

void free_keystream(uint8_t* ptr) {
    if (ptr != NULL) {
        free(ptr);
    }
}


int main() {
    uint8_t key[32] = {
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
        0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F,
        0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17,
        0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F
    };
    uint8_t iv[16] = {
        0xA0, 0xA1, 0xA2, 0xA3, 0xA4, 0xA5, 0xA6, 0xA7,
        0xA8, 0xA9, 0xAA, 0xAB, 0xAC, 0xAD, 0xAE, 0xAF
    };
    
    // Initialize the global cipher
    init_global_cipher(key, iv);
    
    // Generate and print keystream blocks
    for (int i = 0; i < 5; ++i) {
        uint8_t* output = keystream_to_bytes();
        if (output) {
            free_keystream(output);
        }
    }
    return 0;
}