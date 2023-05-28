"use strict";

const path = require("path");
const fs = require("fs");

const { sign } = require("tweetnacl");
const cliProgress = require("cli-progress");

const { defaultPortalUrl, uriS5Prefix } = require("./url");

BigInt.prototype.toJSON = function () {
  return this.toString();
};

let fileSizeCounter = 0;
let endProgressCounter = 0;

function defaultOptions(endpointPath) {
  return {
    portalUrl: defaultPortalUrl(),
    endpointPath: endpointPath,

    APIKey: "",
    s5ApiKey: "",
    authToken: "",
    customUserAgent: "",
    onUploadProgress: undefined,
  };
}

/**
 * Extract only the model's custom options from the given options.
 *
 * @param opts - The given options.
 * @param model - The model options.
 * @returns - The extracted custom options.
 * @throws - If the given opts don't contain all properties of the model.
 */
function extractOptions(opts, model) {
  const result = {};
  for (const property in model) {
    if (!Object.prototype.hasOwnProperty.call(model, property)) {
      continue;
    }
    // Throw if the given options don't contain the model's property.
    if (!Object.prototype.hasOwnProperty.call(opts, property)) {
      throw new Error(`Property '${property}' not found`);
    }
    result[property] = opts[property];
  }

  return result;
}

function walkDirectory(filepath, out) {
  let files = [];
  if (!fs.existsSync(filepath)) {
    return files;
  }

  for (const subpath of fs.readdirSync(filepath)) {
    const fullpath = path.join(filepath, subpath);
    if (fs.statSync(fullpath).isDirectory()) {
      files = files.concat(walkDirectory(fullpath, out));
      continue;
    }
    files.push(fullpath);
  }
  return files;
}

/**
 * Get the publicKey from privateKey.
 *
 * @param privateKey - The privateKey.
 * @returns - The publicKey.
 */
const getPublicKeyFromPrivateKey = function (privateKey) {
  const publicKey = Buffer.from(
    sign.keyPair.fromSecretKey(Uint8Array.from(Buffer.from(privateKey, "hex"))).publicKey
  ).toString("hex");
  return publicKey;
};

/**
 * Formats the S5 cid by adding the s5: prefix.
 *
 * @param cid - The S5 cid.
 * @returns - The formatted S5 cid.
 */
const formatCid = function (cid) {
  if (cid === "") {
    return cid;
  }
  if (!cid.startsWith(uriS5Prefix)) {
    cid = `${uriS5Prefix}${cid}`;
  }
  return cid;
};

/**
 * Set the custom upload progress tracker.
 *
 */
const onUploadProgress = (progress, { loaded, total }) => {
  let progressOutput = Math.floor((loaded * 100) / total);

  if (progressOutput === 0 && fileSizeCounter === 0) {
    process.stdout.write(" The uploading File size is " + total + " bytes.\n\n");
    process.stdout.moveCursor(0, -1);
    fileSizeCounter++;
  }

  // create new progress bar with custom token "speed"
  const bar = new cliProgress.Bar({
    format: "-> uploading [{bar}] " + progressOutput + "% {eta_formatted} ",
    fps: 1,
  });

  // initialize the bar - set payload token "speed" with the default value "N/A"
  bar.start(100, 0, {
    speed: "N/A",
  });
  bar.updateETA(Buffer);
  // update bar value. set custom token "speed" to 125
  bar.update(progressOutput, {
    speed: "122",
  });

  // stop the bar
  bar.stop();

  if (progressOutput === 100) {
    process.stdout.write(`\n`);
    process.stdout.moveCursor(0, -1);
    process.stdout.write(`\n`);
    endProgressCounter++;
    if (endProgressCounter === 2) {
      process.stdout.write(`\n\n`);
    }
  }
  process.stdout.moveCursor(0, -1);
};

module.exports = {
  defaultOptions,
  extractOptions,
  walkDirectory,
  getPublicKeyFromPrivateKey,
  formatCid,
  onUploadProgress,
};
