"use strict";

const urljoin = require("url-join");

/**
 * The default URL of the S5 portal to use in the absence of configuration.
 */
const defaultS5PortalUrl = "http://127.0.0.1:5522";

/**
 * The URI prefix for S5-net.
 */
const uriS5Prefix = "s5://";

/**
 * Selects the default portal URL to use when initializing a client. May involve network queries to several candidate portals.
 */
function defaultPortalUrl() {
  return defaultS5PortalUrl;
}

/**
 * Properly joins paths together to create a URL. Takes a variable number of
 * arguments.
 */
function makeUrl() {
  let args = Array.from(arguments);
  return args.reduce(function (acc, cur) {
    return urljoin(acc, cur);
  });
}

module.exports = {
  defaultS5PortalUrl,
  uriS5Prefix,
  defaultPortalUrl,
  makeUrl,
};
