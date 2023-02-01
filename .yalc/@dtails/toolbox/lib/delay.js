"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.delay = delay;
function delay(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}