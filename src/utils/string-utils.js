/**
 * String manipulation utilities for protodef-yaml
 * Provides helper functions for formatting, padding, and processing text
 */

// Logging function (currently disabled for production)
const log = () => { }

/**
 * Calculate the indentation level of a line based on leading spaces
 * @param {string} line - The line to analyze
 * @returns {number} Number of leading spaces
 */
function getIndentation (line) {
  if (typeof line !== 'string') return 0

  let indentation = 0
  for (const char of line) {
    if (char === ' ') {
      indentation++
    } else {
      break
    }
  }
  return indentation
}

/**
 * Add padding (spaces) to the beginning of a line
 * @param {number} indentation - Number of spaces to add
 * @param {string} line - The line content to pad
 * @returns {string} Padded line
 */
function pad (indentation, line) {
  if (typeof indentation !== 'number' || indentation < 0) {
    return line
  }

  return ' '.repeat(indentation) + line
}

/**
 * Extract name from a special key format
 * Handles keys that start with '%' by extracting the name portion
 * @param {string} key - The key to process
 * @returns {string} Extracted name or original key
 */
function getName (key) {
  if (typeof key !== 'string') return key

  if (key.startsWith('%')) {
    const parts = key.split(',')
    return parts.length > 1 ? parts[1] : key
  }
  return key
}

/**
 * Check if a string appears to contain JSON-like syntax
 * @param {string} str - String to check
 * @returns {boolean} True if string contains JSON-like characters
 */
function hasJsonSyntax (str) {
  if (typeof str !== 'string') return false

  const jsonChars = ['"', '[', ']', '{', '}']
  return jsonChars.some(char => str.includes(char))
}

module.exports = {
  log,
  getIndentation,
  pad,
  getName,
  hasJsonSyntax
}
