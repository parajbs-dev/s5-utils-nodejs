// Import the 'buffer' module for working with binary data
const Buffer = require('buffer').Buffer;

// Define the Base58 alphabet used for Bitcoin addresses
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Encodes a buffer of bytes using Base58 encoding (specifically designed for Bitcoin addresses).
 *
 * @param {Buffer} bytes - The buffer of bytes to encode.
 * @returns {string} The Base58-encoded string representation of the input bytes.
 */
function encodeBase58BTC(bytes) {
  let digits = [0]; // Initialize an array of digits with a single 0

  for (let i = 0; i < bytes.length; i++) {
    // Multiply each digit in the array by 256 (left-shift by 8 bits) and add the byte's value to the first digit
    for (let j = 0; j < digits.length; j++) {
      digits[j] <<= 8;
    }
    digits[0] += bytes[i];

    // Perform a base conversion from base 256 to base 58
    let carry = 0;
    for (let j = 0; j < digits.length; ++j) {
      digits[j] += carry;
      carry = (digits[j] / 58) | 0;
      digits[j] %= 58;
    }

    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  // Remove leading zeros from the digits array and convert the remaining digits back to characters in the ALPHABET string
  let result = '';
  while (digits[digits.length - 1] === 0) {
    digits.pop();
  }

  for (let i = digits.length - 1; i >= 0; i--) {
    result += ALPHABET[digits[i]];
  }

  return result;
}

/**
 * Decodes a Base58btc string into a Buffer object.
 *
 * @param str The Base58btc encoded string to decode.
 * @returns A Buffer object containing the decoded bytes.
 * @throws Error if the input string is not a valid Base58btc string.
 */
function decodeBase58BTC(str) {
  const bytes = []; // Initialize an empty array for the decoded bytes

  for (let i = 0; i < str.length; i++) {
    // Convert each character in the input string to its corresponding value in the ALPHABET string
    let value = ALPHABET.indexOf(str[i]);
    if (value === -1) {
      throw new Error('Invalid Base58Bitcoin string');
    }

    // Perform a base conversion from base 58 to base 256
    for (let j = 0; j < bytes.length; j++) {
      value += bytes[j] * 58;
      bytes[j] = value & 0xff;
      value >>= 8;
    }

    while (value > 0) {
      bytes.push(value & 0xff);
      value >>= 8;
    }
  }

  // Reverse the order of the bytes in the array and return as a Buffer
  bytes.reverse();
//  return new Uint8Array(bytes);
  return Buffer.from(bytes);
}

// Base32 RFC 4648 Alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes data using the Base32 encoding scheme based on the RFC 4648 specification.
 *
 * @param data - The input data to be encoded as a Buffer object.
 * @returns The Base32 encoded string.
 */
function encodeBase32RFC(data) {
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < data.length; i++) {
    // Append the bits of the current byte to the value
    value = (value << 8) | data[i];
    bits += 8;

    // While there are at least 5 bits in the value, extract the 5 most significant bits
    while (bits >= 5) {
      const index = (value >>> (bits - 5)) & 31; // Mask the 5 most significant bits
      result += BASE32_ALPHABET.charAt(index); // Append the corresponding character to the result
      bits -= 5; // Remove the 5 bits from the value
    }
  }

  // If there are any remaining bits in the value, append the final character to the result
  if (bits > 0) {
    const index = (value << (5 - bits)) & 31; // Pad the remaining bits with 0s and mask the 5 most significant bits
    result += BASE32_ALPHABET.charAt(index); // Append the corresponding character to the result
  }

  return result;
}

/**
 * Decodes a string encoded in Base32 RFC 4648 format into a Buffer object.
 *
 * @param {string} encoded - The Base32 encoded string to decode.
 * @returns {Buffer} - A Buffer containing the decoded bytes.
 */
function decodeBase32RFC(encoded) {
  const result = Buffer.alloc(Math.ceil(encoded.length * 5 / 8)); // Allocate the result buffer

  let bits = 0;
  let value = 0;
  let index = 0;

  for (let i = 0; i < encoded.length; i++) {
    const c = encoded.charAt(i);
    const charIndex = BASE32_ALPHABET.indexOf(c);

    // Append the bits corresponding to the character to the value
    value = (value << 5) | charIndex;
    bits += 5;

    // While there are at least 8 bits in the value, extract the 8 most significant bits
    if (bits >= 8) {
      result[index++] = (value >>> (bits - 8)) & 255; // Mask the 8 most significant bits and append to the result
      bits -= 8; // Remove the 8 bits from the value
    }
  }

  // Return the Buffer
  return result.slice(0, index);
}

/**
 * Encodes a buffer into a Base64URL string.
 *
 * @param {Buffer} input - The buffer to be encoded.
 * @returns {string} The Base64URL-encoded string.
 */
function encodeBase64URL(input) {
  // Convert the buffer into a Base64 string
  const base64 = Buffer.from(input).toString('base64');

  // Replace characters in the Base64 string to make it URL-safe
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Decodes a Base64 URL-encoded string into a Buffer object.
 *
 * @param {string} input - The Base64 URL-encoded string to decode.
 * @returns {Buffer} - A Buffer object containing the decoded binary data.
 */
function decodeBase64URL(input) {
  // Replace characters '-' with '+' and '_' with '/' in the input string
  input = input.replace(/-/g, '+').replace(/_/g, '/');

  // Calculate the padding length
  const paddingLength = input.length % 4;

  // Append necessary padding characters to the input string
  if (paddingLength > 0) {
    input += '='.repeat(4 - paddingLength);
  }

  // Decode the modified Base64 string using the built-in Buffer.from function
  let base64 = Buffer.from(input, 'base64').toString('latin1');
  // Create a new Uint8Array and set each element of the array
  // to the corresponding character code in the decoded string.
  let output = new Uint8Array(base64.length);
  for (let i = 0; i < base64.length; i++) {
    output[i] = base64.charCodeAt(i);
  }
  return output;
}

module.exports = {
  encodeBase58BTC,
  decodeBase58BTC,
  encodeBase32RFC,
  decodeBase32RFC,
  encodeBase64URL,
  decodeBase64URL,
};
