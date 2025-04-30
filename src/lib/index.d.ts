export declare function init(): Promise<void>;
export declare function setupKeyIV(key: Uint8Array, iv: Uint8Array): Promise<void>;
export declare function generateKeystreamBlock(): Promise<Uint8Array>;
export declare function cleanup(): void;

