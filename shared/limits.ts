/**
 * Limits both sides must agree on: the server enforces them, and the client
 * uses the same values so that it never asks for something the server refuses.
 */

/** A show or season id: a plain positive whole number, with no sign, decimals or exponent. */
export const ID_PATTERN = /^[1-9]\d{0,9}$/

/** How many shows a genre row holds. */
export const GENRE_ROW_SIZE = 20

/** The longest search text or genre name accepted. */
export const MAX_TEXT_LENGTH = 100
