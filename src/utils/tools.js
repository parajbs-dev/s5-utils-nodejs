"use strict";

const {
  encodeBase58BTC,
  decodeBase58BTC,
  encodeBase32RFC,
  decodeBase32RFC,
  encodeBase64URL,
  decodeBase64URL,
} = require("./basetools");

/**
 * Converts a number into a Buffer of a specified size.
 * If the resulting value requires fewer bytes than the buffer size,
 * the returned Buffer will be truncated accordingly.
 *
 * @param {number} value - The number to convert into a Buffer.
 * @param {number} bufferSize - The desired size of the resulting Buffer.
 * @returns {Buffer} A Buffer containing the converted number.
 */
function numToBuf(value, bufferSize) {
  const buffer = Buffer.alloc(bufferSize);
  let lastIndex = bufferSize - 1;

  for (let i = 0; i <= lastIndex; i++) {
    if (value === 0) {
      lastIndex = i - 1;
      break;
    }

    buffer[i] = value % 256;
    value = value >> 8;
  }

  return buffer.slice(0, lastIndex + 1);
}

/**
 * Converts a portion of a Buffer to a signed integer.
 * 
 * @param {Buffer} buffer - The Buffer containing the bytes to read from.
 * @returns {number} - The signed integer value obtained from the Buffer.
 */
function bufToNum(buffer) {
  let value = 0n;
  const bufferLength = buffer.length;

  for (let i = bufferLength - 1; i >= 0; i--) {
    value = (value << 8n) + BigInt(buffer[i]);
  }

  return Number(value);
}

/**
 * Encodes a CID (Content Identifier) with a prefix "z" using base58btc-encoding.
 *
 * @param {Buffer} bytes - The Buffer object representing the Bitcoin address.
 * @returns {string} - The CID with the prefix "z".
 */
function encodeCIDWithPrefixZ(bytes) {
  // Check if the bytes has a length of 38 (standard uncompressed Bitcoin address)
  if (bytes.length === 38) {
    // Encode the input address using base58 encoding
    const zCid = 'z' + encodeBase58BTC(bytes);
    // Return the modified Bitcoin address with the prefix "z"
    return zCid;
  } else {
    // Encode the input address using base58 encoding
    const zCid = 'z' + encodeBase58BTC(bytes);
    // Return the modified Bitcoin address with the prefix "z"
    return zCid;
  }
}

/**
 * Decodes a CID (Content Identifier) with a prefix 'z' if present.
 *
 * @param {string} cid - The CID to decode.
 * @returns {Buffer} - A Buffer containing the decoded CID.
 * @throws {Error} - If the input address is invalid.
 */
function decodeCIDWithPrefixZ(cid) {
  if (cid[0] === 'z') {
    const zCidBytes = decodeBase58BTC(cid.substring(1));
    return zCidBytes;
  }

  if (cid[0] !== 'z') {
    const zCidBytes = decodeBase58BTC(cid);
    return zCidBytes;
  }

  // Handle the case where none of the conditions are met
  throw new Error('Invalid input address');
}

/**
 * Encodes a CID (Content Identifier) with a "u" prefix using base64url-encoding.
 * 
 * @param {Buffer} bytes - The input CID as a Buffer object.
 * @returns {string} The encoded CID with the "u" prefix as a string.
 */
function encodeCIDWithPrefixU(bytes) {
  // Check if the input CID is of length 38.
  if (bytes.length === 38) {
    // Encode the CID using base64url-encoding and prefix it with "u".
    const uCid = 'u' + encodeBase64URL(bytes);
    return uCid;
  } else {
    // Encode the CID using base64url-encoding and prefix it with "u".
    const uCid = 'u' + encodeBase64URL(bytes);
    return uCid;
  }
}

/**
 * Decodes a Content Identifier (CID) with a prefix 'u' and returns the decoded bytes as a Buffer.
 * 
 * @param {string} cid - The CID to decode, either prefixed with 'u' or already decoded.
 * @returns {Buffer} - A Buffer containing the decoded bytes of the CID.
 * @throws {Error} - Throws an error for an invalid 'u' CID format.
 */
function decodeCIDWithPrefixU(cid) {
  if (cid[0] === 'u') {
    const uCidBytes = decodeBase64URL(cid.substring(1));
    return Buffer.from(uCidBytes);
  } 

  if (cid[0] !== 'u') {
    // Assume the input CID is already decoded and decode it using base64url-decoding.
    const uCidBytes = decodeBase64URL(cid);
    return Buffer.from(uCidBytes);
  }
  
  // Throw an error for invalid CID format.
  throw new Error('Invalid u CID format');
}

/**
 * Encodes the given bytes using Base32rfc-encoding and prefixes the result with 'b'.
 *
 * @param {Buffer} bytes - The bytes to encode (should have a length of 38).
 * @returns {string} - The encoded string prefixed with 'b', or an empty string if the input is invalid.
 */
function encodeCIDWithPrefixB(bytes) {
  if (bytes.length === 38) {
    const bCid = 'b' + encodeBase32RFC(bytes).toLowerCase();
    return bCid;
  } else {
    const bCid = 'b' + encodeBase32RFC(bytes).toLowerCase();
    return bCid;
  }
}

/**
 * Decodes a CID (Content Identifier) with a prefix 'B' or 'b' and returns the decoded bytes as a Buffer object.
 * If the CID starts with 'B' and contains any uppercase letters, it converts the CID to lowercase and removes the 'B' prefix.
 * If the CID starts with 'b' and contains any lowercase letters, it removes the 'b' prefix.
 * If the CID contains any lowercase letters, it converts all characters to uppercase.
 *
 * @param {string} cid - The CID string to decode.
 * @returns {Buffer} - The decoded CID bytes as a Buffer object.
 */
function decodeCIDWithPrefixB(cid) {
  if (cid[0] === 'B' && /[A-Z]/.test(cid)) {
    cid = cid.toLowerCase(); // Convert the CID to lowercase
    cid = cid.substring(1); // Remove the first character ("B")
  }

  if (cid[0] === 'b' && /[a-z]/.test(cid)) {
    cid = cid.substring(1); // Remove the first character ("b")
  }

  if (/[a-z]/.test(cid)) {
    cid = cid.toUpperCase(); // Convert all characters to uppercase
  }

  const bCidBytes = decodeBase32RFC(cid); // Assuming decodeBase32RFC is defined elsewhere
  return bCidBytes;
}

/**
 * Converts a Base58btc-encoded CID to a Base32rfc-encoded CID.
 *
 * @param {string} cid - The Base58btc-encoded CID string to convert.
 * @returns {string} - The Base32rfc-encoded CID string.
 */
function convertB58btcToB32rfcCid(cid) {
  // Decode the base58btc-encoded CID using decodeBase58BTC function.
  const decoded = decodeBase58BTC(cid.substring(1));

  // Encode the decoded binary data as base32rfc using encodeBase32RFC function.
  const encoded = encodeBase32RFC(decoded).toString().replace(/=+$/, '').toLowerCase();

  // Add a 'b' prefix to the base32rfc-encoded string and return the result.
  return `b${encoded}`;
}

/**
 * Converts a Base32rfc-encoded CID to a Base58btc-encoded CID.
 *
 * @param {string} cid - The Base32rfc-encoded CID to convert.
 * @returns {string} - The Base58btc-encoded CID.
 */
function convertB32rfcToB58btcCid(cid) {
  // Decode the base32rfc-encoded CID using decodeBase32RFC function.
  const decoded = decodeBase32RFC(cid.substring(1).toUpperCase());

  // Encode the decoded binary data as base58btc using encodeBase58BTC function.
  const encoded = encodeBase58BTC(decoded);

  // Add a 'z' prefix to the base58btc-encoded string and return the result.
  return `z${encoded}`;
}

/**
 * Converts a base64URL-encoded CID to a base58btc-encoded CID.
 *
 * @param {string} cid - The base64URL-encoded CID to convert.
 * @returns {string} - The base58btc-encoded CID.
 */
function convertB64urlToB58btcCid(cid) {
  // Decode the base58btc-encoded CID using decodeBase58BTC function.
  const decoded = decodeBase64URL(cid.substring(1));

  // Encode the decoded binary data as base58btc using encodeBase58BTC function.
  const encoded = encodeBase58BTC(decoded);

  // Add a 'z' prefix to the base58btc-encoded string and return the result.
  return `z${encoded}`;
}

/**
 * Converts a base58btc-encoded CID (Content Identifier) to a base64url-encoded CID.
 *
 * @param {string} cid - The base58btc-encoded CID to be converted.
 * @returns {string} The base64url-encoded CID with a 'u' prefix.
 */
function convertB58btcToB64urlCid(cid) {
  // Decode the base58btc-encoded CID using decodeBase58BTC function.
  const decoded = decodeBase58BTC(cid.substring(1));

  // Encode the decoded binary data as base64url using encodeBase64URL function.
  const encoded = encodeBase64URL(decoded);

  // Add a 'u' prefix to the base64url-encoded string and return the result.
  return `u${encoded}`;
}

/**
 * Converts a base64url-encoded CID to a base32rfc-encoded CID.
 *
 * @param {string} cid - The base64url-encoded CID to convert.
 * @returns {string} - The base32rfc-encoded CID.
 */
function convertB64urlToB32rfcCid(cid) {
  // Decode the base64url-encoded CID using the built-in Buffer class.
  const decoded = Buffer.from(cid.substring(1), 'base64url');

  // Encode the decoded binary data as base32rfc using a custom implementation.
  const encoded = encodeBase32RFC(decoded).toString().replace(/=+$/, '').toLowerCase();

  // Add a 'b' prefix to the base32rfc-encoded string and return the result.
  return `b${encoded}`;
}

/**
 * Converts a base32rfc-encoded CID to a base64url-encoded CID.
 *
 * @param {string} cid - The base32rfc-encoded CID to be converted.
 * @returns {string} The base64url-encoded CID.
 */
function convertB32rfcToB64urlCid(cid) {
  // Decode the base32rfc-encoded CID using decodeBase32RFC function.
  const decoded = decodeBase32RFC(cid.substring(1).toUpperCase());

  // Encode the decoded binary data as base64url using encodeBase64URL function.
  const encoded = encodeBase64URL(decoded);

  // Add a 'u' prefix to the base64url-encoded string and return the result.
  return `u${encoded}`;
}

/**
 * Converts the download directory input CID into a different format based on certain conditions.
 *
 * @param {string} cid - The input CID to be converted.
 * @returns {string} - The converted CID.
 * @throws {Error} - If the input CID is invalid or cannot be converted.
 */
function convertDownloadDirectoryInputCid(cid) {
  let responseCid = null;

  if (cid.startsWith('http')) {
    const subdomain = getSubdomainFromUrl(cid);
    if (subdomain !== null) {
      responseCid = subdomain;
    } else {
      throw new Error('Invalid CID input address');
    }
  } else {
    if (cid[0] === 'z') {
      responseCid = convertB58btcToB32rfcCid(cid);
    }
    if (cid[0] === 'u') {
      responseCid = convertB64urlToB32rfcCid(cid);
    }
    if (cid[0] === 'b') {
      responseCid = cid;
    }
  }

  if (responseCid !== null) {
    return responseCid;
  } else {
    throw new Error('Invalid CID input address');
  }
}

/**
 * Adds a subdomain to the given URL.
 *
 * @param url - The URL.
 * @param subdomain - The subdomain to add.
 * @returns - The final URL.
 */
function addUrlSubdomain(url, subdomain) {
  const urlObj = new URL(url);
  urlObj.hostname = `${subdomain}.${urlObj.hostname}`;
  const str = urlObj.toString();
  return str.substring(0, str.length -1);
}

/**
 * Returns the first subdomain of the given URL.
 * If the URL does not contain a subdomain, returns null.
 *
 * @param url The URL to extract the subdomain from.
 * @returns The first subdomain of the URL, or null if there is no subdomain.
 */
function getSubdomainFromUrl(url) {
  // Use a regular expression to match the first subdomain in the URL.
  const subdomain = url.match(/^(?:https?:\/\/)?([^./]+)\./i);

  // If a subdomain was found, return it. Otherwise, return null.
  return subdomain ? subdomain[1] : null;
}

module.exports = {
  numToBuf,
  bufToNum,
  encodeCIDWithPrefixZ,
  decodeCIDWithPrefixZ,
  encodeCIDWithPrefixU,
  decodeCIDWithPrefixU,
  encodeCIDWithPrefixB,
  decodeCIDWithPrefixB,
  convertB58btcToB32rfcCid,
  convertB32rfcToB58btcCid,
  convertB64urlToB58btcCid,
  convertB58btcToB64urlCid,
  convertB64urlToB32rfcCid,
  convertB32rfcToB64urlCid,
  convertDownloadDirectoryInputCid,
  addUrlSubdomain,
  getSubdomainFromUrl,
};

