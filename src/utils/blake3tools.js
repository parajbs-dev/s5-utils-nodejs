// blake3tools
const fs = require('fs');
//const path = require('path');
const { Blake3Hasher } = require("@napi-rs/blake-hash");

// Import the 'buffer' module for working with binary data
const Buffer = require('buffer').Buffer;

const {
  numToBuf,
  bufToNum,
  encodeCIDWithPrefixZ,
  encodeCIDWithPrefixU,
  encodeCIDWithPrefixB,
  decodeCIDWithPrefixZ,
  decodeCIDWithPrefixU,
  decodeCIDWithPrefixB,
} = require("./tools");

const { mhashBlake3Default, cidTypeRaw } = require("./constants");

/**
 * Calculates the Blake3 hash of a file given its path.
 *
 * @param {string} path - The path to the file.
 * @returns {Promise<Buffer>} - A promise that resolves with the hash value as a Buffer, or rejects with an error.
 */
async function calculateB3hashFromFile(path) {
  // Create a readable stream from the file
  const stream = fs.createReadStream(path);

  // Create an instance of Blake3Hasher
  const hasher = new Blake3Hasher();
  
  return new Promise((resolve, reject) => {
    // Handle error event
    stream.on("error", (err) => reject(err));

    // Handle data event
    stream.on("data", (chunk) => hasher.update(chunk));

    // Handle end event
    stream.on("end", () => resolve(hasher.digestBuffer()));
  });
}

/**
 * Generates an S5 mHash by prepending a given Blake3 hash with a default value.
 *
 * @param {Buffer} b3hash - The input Blake3 hash buffer.
 * @returns {Buffer} The resulting S5 mHash buffer.
 */
function generateMHashFromB3hash(b3hash) {
  // Create a new Buffer called `mHash`.
  const mHash = Buffer.concat([Buffer.alloc(1, mhashBlake3Default), b3hash]);

  // Return the `mHash` buffer as the result.
  return mHash;
}

/**
 * Extracts the Blake3 hash from the given mHash buffer.
 * 
 * @param {Buffer} mHash - The mHash buffer from which to extract the Blake3 hash.
 * @returns {Buffer} The extracted Blake3 hash buffer.
 */
function extractB3hashFromMHash(mHash) {
  // Slice the input buffer starting from index 1
  const b3hash = mHash.slice(1);

  // Return the extracted portion
  return b3hash;
}

/**
 * Generates a S5 CID (Content Identifier) from a hash and file size - into a Buffer.
 *
 * @param mHash {Buffer} The hash value as a Buffer object.
 * @param filePath {string} The path to the file.
 * @returns {Buffer} The generated CID as a Buffer object.
 */
function generateCIDFromMHash(mHash, filePath) {
  // Buffer size for storing the file size
  const bufSize = 16;

  // Read the file size synchronously
  const fileSize = fs.statSync(filePath).size;

  // Concatenate the CID parts
  const cid = Buffer.concat([
    Buffer.alloc(1, cidTypeRaw), // CID type (assuming `cidTypeRaw` is defined)
    mHash, // Hash
    numToBuf(fileSize, bufSize) // File size converted to buffer
  ]);

  return cid;
}

/**
 * Extracts the mHash from a CID buffer.
 * 
 * @param {Buffer} cid - The CID buffer.
 * @returns {Buffer} - The extracted mHash as a Buffer.
 */
function extractMHashFromCID(cid) {
  // Size of the CID type (assuming 1 byte)
  const cidTypeSize = 1;

  // Size of the hash (assuming hash size matches mHash)
  let hashSize = cid.length - cidTypeSize; // Initialize hashSize with a value
  let i = 0;
  while (hashSize !== 33) {
    // Update the variables for the next iteration
    i++;
    hashSize = cid.length - i;
  }

  // Extract the mHash from the CID buffer
  const mHash = cid.slice(cidTypeSize, cidTypeSize + hashSize);

  return mHash;
}

/**
 * Extracts the raw file size from a CID (Content Identifier) buffer.
 * 
 * @param cid - The CID buffer containing the file size information.
 * @returns The extracted file size as a number.
 */
function extractRawSizeFromCID(cid) {
  let sliceLength = 0;

  sliceLength = cid.length >= 34 ? 34 : 33;

  // Extract the portion of the CID buffer containing the file size information
  const rawfilesizeBuffer = cid.slice(sliceLength);

  const rawfilesize = bufToNum(rawfilesizeBuffer);

  // Return the file size
  return rawfilesize;
}

/**
 * Extracts a Blake3 hash from a CID (Content Identifier) buffer.
 *
 * @param {Buffer} cid - The CID buffer.
 * @returns {Buffer} - The extracted Blake3 hash as a buffer.
 */
function extractB3hashFromCID(cid) {
  // Size of the CID type (assuming 1 byte)
  const cidTypeSize = 1;

  let hashSize = cid.length - cidTypeSize; // Initialize hashSize with a value
  let i = 0;
  while (hashSize !== 33) {
    // Update the variables for the next iteration
    i++;
    hashSize = cid.length - i;
  }

  // Extract the mHash from the CID buffer
  const mHash = cid.slice(cidTypeSize, cidTypeSize + hashSize);

  // Call the extractB3hashFromMHash function to obtain the Blake3 hash
  const b3hash = extractB3hashFromMHash(mHash);

  return b3hash;
}

/**
 * Converts a hash Buffer to a URL-safe Base64 string.
 *
 * @param {Buffer} mHash - The mHash Buffer to be converted.
 * @returns {string} - The URL-safe Base64 string representation of the mHash.
 */
function convertMHashToB64url(mHash) {
  // Convert the hash Buffer to a Base64 string
  const hashBase64 = mHash.toString("base64");

  // Make the Base64 string URL-safe
  const hashBase64url = hashBase64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace("=", "");

  return hashBase64url;
}

/**
 * Converts a S5 CID (Content Identifier) to an mHash.
 * 
 * @param {string} cid - The CID string to convert.
 * @returns {Buffer} - The mHash as a Buffer.
 * @throws {Error} - If the CID input address is invalid.
 */
function convertS5CidToMHash(cid) {
  let mhash;

  if (cid[0] === 'z') {
    const cidBytes = decodeCIDWithPrefixZ(cid);
    mhash = extractMHashFromCID(cidBytes);
  } else if (cid[0] === 'u') {
    const cidBytes = decodeCIDWithPrefixU(cid);
    mhash = extractMHashFromCID(cidBytes);
  } else if (cid[0] === 'b') {
    const cidBytes = decodeCIDWithPrefixB(cid);
    mhash = extractMHashFromCID(cidBytes);
  } else {
    throw new Error('Invalid CID input address');
  }

  return Buffer.from(mhash);
}

/**
 * Convert the S5 CID to CID bytes.
 * @param {string} cid - The S5 CID to be converted.
 * @returns {string} - The CID bytes.
 * @throws {Error} - Throws an error if the input CID is invalid.
 */
function convertS5CidToCIDBytes(cid) {
  let cidBytes;

  if (cid[0] === 'z') {
    cidBytes = decodeCIDWithPrefixZ(cid);
  }
  if (cid[0] === 'u') {
    cidBytes = decodeCIDWithPrefixU(cid);
  }
  if (cid[0] === 'b') {
    cidBytes = decodeCIDWithPrefixB(cid);
  }

  if (cidBytes != null) {
    return cidBytes;
  } else {
    throw new Error('Invalid CID input address');
  }
}

/**
 * Checks if the raw size extracted from the given CID is not null.
 * @param {string} cid - The CID (Content Identifier) to check the raw size for.
 * @returns {boolean} - Returns true if the raw size is not null, false otherwise.
 */
function checkRawSizeIsNotNull(cid) {
  let rawSizeIsNotNull;

  const cidBytes = convertS5CidToCIDBytes(cid);
  const b3FilesSize = extractRawSizeFromCID(cidBytes);

  if (b3FilesSize != 0) {
    rawSizeIsNotNull = true;
  } else {
    rawSizeIsNotNull = false;
  }
  return rawSizeIsNotNull;
}

/**
 * Converts an S5 CID to a base64 URL-formatted mHash.
 * 
 * @param {string} cid - The S5 CID to convert.
 * @returns {string} - The base64 URL-formatted mHash.
 */
function convertS5CidToMHashB64url(cid) {
  const cidBytes = convertS5CidToCIDBytes(cid);
  const b3FilesSize = extractRawSizeFromCID(cidBytes);

//  const rawSizeIsNotNull = checkRawSizeIsNotNull(cid);
//  console.log(rawSizeIsNotNull);

  if (b3FilesSize != 0) {
    // Convert S5 CID to MHash
    const mhash2cid = convertS5CidToMHash(cid);

    // Convert MHash to Base64 URL format
    const mHashBase64url = convertMHashToB64url(mhash2cid);

    // Return the Base64 URL formatted MHash
    return mHashBase64url;
  } else {
    return "";
  }
}

/**
 * Converts an S5 CID (Content Identifier) to a Blake3 hash in hexadecimal format.
 * 
 * @param {string} cid - The S5 CID to convert.
 * @returns {string} - The Blake3 hash of the CID in hexadecimal format.
 * @throws {Error} - If the input CID is invalid.
 */
function convertS5CidToB3hashHex(cid) {
  let b3hash = null;

  if (cid[0] === 'z') {
    // Decode the CID using decodeCIDWithPrefixZ function
    const zcidBytes = decodeCIDWithPrefixZ(cid);
    const b3FilesSize = extractRawSizeFromCID(zcidBytes);
    if (b3FilesSize != 0) {
      b3hash = extractB3hashFromCID(zcidBytes);
    } else {
      b3hash = null;
    }
  }
  if (cid[0] === 'u') {
    // Decode the CID using decodeCIDWithPrefixU function
    const ucidBytes = decodeCIDWithPrefixU(cid);
    const b3FilesSize = extractRawSizeFromCID(ucidBytes);
    if (b3FilesSize != 0) {
      b3hash = extractB3hashFromCID(ucidBytes);
    } else {
      b3hash = null;
    }
  }
  if (cid[0] === 'b') {
    // Decode the CID using decodeCIDWithPrefixB function
    const bcidBytes = decodeCIDWithPrefixB(cid);
    const b3FilesSize = extractRawSizeFromCID(bcidBytes);
    if (b3FilesSize != 0) {
      b3hash = extractB3hashFromCID(bcidBytes);
    } else {
      b3hash = null;
    }
  }

  if (b3hash != null) {
    return b3hash.toString('hex');
  } else {
    throw new Error('Invalid CID input address');
  }
}

/**
 * Retrieves various information from a CID (Content Identifier).
 * 
 * @param {string} cid - The CID string.
 * @returns {Object} - An object containing different representations and extracted information from the CID.
 * @throws {Error} - If the CID input address is invalid.
 */
function getAllInfosFromCid(cid) {
  let zCid; // CID encoded with the "z" prefix
  let uCid; // CID encoded with the "u" prefix
  let bCid; // CID encoded with the "b" prefix
  let mHashBase64url; // CID converted to Base64URL-encoded multihash
  let b3hashHex; // CID converted to hexadecimal B3 hash
  let b3FilesSize; // Raw size extracted from the CID

  // Check the first character of the CID string
  if (cid[0] === 'z') {
    // Decode the CID using decodeCIDWithPrefixZ function
    const zcidBytes = decodeCIDWithPrefixZ(cid);

    zCid = encodeCIDWithPrefixZ(zcidBytes);
    uCid = encodeCIDWithPrefixU(zcidBytes);
    bCid = encodeCIDWithPrefixB(zcidBytes);
    b3FilesSize = extractRawSizeFromCID(zcidBytes);

    if (b3FilesSize != 0) {
      mHashBase64url = convertS5CidToMHashB64url(cid);
      b3hashHex = convertS5CidToB3hashHex(cid);
    } else {
      mHashBase64url = "It is not possible!";
      b3hashHex = "It is not possible!";
    }
  } else if (cid[0] === 'u') {
    // Decode the CID using decodeCIDWithPrefixU function
    const ucidBytes = decodeCIDWithPrefixU(cid);

    zCid = encodeCIDWithPrefixZ(ucidBytes);
    uCid = encodeCIDWithPrefixU(ucidBytes);
    bCid = encodeCIDWithPrefixB(ucidBytes);
    b3FilesSize = extractRawSizeFromCID(ucidBytes);
    if (b3FilesSize != 0) {
      mHashBase64url = convertS5CidToMHashB64url(cid);
      b3hashHex = convertS5CidToB3hashHex(cid);
    } else {
      mHashBase64url = "It is not possible!";
      b3hashHex = "It is not possible!";
    }
  } else if (cid[0] === 'b') {
    // Decode the CID using decodeCIDWithPrefixB function
    const bcidBytes = decodeCIDWithPrefixB(cid);

    zCid = encodeCIDWithPrefixZ(bcidBytes);
    uCid = encodeCIDWithPrefixU(bcidBytes);
    bCid = encodeCIDWithPrefixB(bcidBytes);
    b3FilesSize = extractRawSizeFromCID(bcidBytes);
    if (b3FilesSize != 0) {
      mHashBase64url = convertS5CidToMHashB64url(cid);
      b3hashHex = convertS5CidToB3hashHex(cid);
    } else {
      mHashBase64url = "It is not possible!";
      b3hashHex = "It is not possible!";
    }
  } else {
    // Invalid CID input address
    throw new Error('Invalid CID input address');
  }

  return {
    zcid: zCid,
    ucid: uCid,
    bcid: bCid,
    mhashb64url: mHashBase64url,
    b3hashhex: b3hashHex,
    b3filesize: b3FilesSize
  };
}

module.exports = {
  calculateB3hashFromFile,
  generateMHashFromB3hash,
  extractB3hashFromMHash,
  generateCIDFromMHash,
  extractMHashFromCID,
  extractRawSizeFromCID,
  extractB3hashFromCID,
  convertMHashToB64url,
  convertS5CidToMHash,
  convertS5CidToCIDBytes,
  checkRawSizeIsNotNull,
  convertS5CidToMHashB64url,
  convertS5CidToB3hashHex,
  getAllInfosFromCid,
};
