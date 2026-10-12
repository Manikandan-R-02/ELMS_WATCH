/** Shared input-masking helpers for the date/time pickers' typeable trigger fields. */

export function digitsOnly(value: string): string {
  return value.replaceAll(/\D/g, "");
}

/**
 * Rebuilds `raw` as digit groups joined by `separators`, inserting each
 * separator automatically as soon as its segment is filled (e.g. typing
 * "28082026" becomes "28/08/2026" as the user types).
 */
export function applyDigitMask(raw: string, segmentLengths: number[], separators: string[]): string {
  const totalDigits = segmentLengths.reduce((a, b) => a + b, 0);
  const digits = digitsOnly(raw).slice(0, totalDigits);

  let result = "";
  let pos = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    const len = segmentLengths[i];
    const chunk = digits.slice(pos, pos + len);
    if (!chunk) break;
    result += chunk;
    pos += len;
    const isLastSegment = i === segmentLengths.length - 1;
    if (!isLastSegment && pos < digits.length) {
      result += separators[i] ?? "";
    }
  }
  return result;
}

export const DATE_SEGMENTS = [2, 2, 4];
export const DATE_SEPARATORS = ["/", "/"];
export const DATE_INPUT_FORMAT = "dd/MM/yyyy";
export const DATE_INPUT_LENGTH = 10;

export const MONTH_SEGMENTS = [2, 4];
export const MONTH_SEPARATORS = ["/"];
export const MONTH_INPUT_FORMAT = "MM/yyyy";
export const MONTH_INPUT_LENGTH = 7;

export const YEAR_SEGMENTS = [4];
export const YEAR_SEPARATORS: string[] = [];
export const YEAR_INPUT_LENGTH = 4;

export const TIME_SEGMENTS = [2, 2];
export const TIME_SEPARATORS = [":"];
export const TIME_INPUT_LENGTH = 5;

export const RANGE_SEGMENTS = [2, 2, 4, 2, 2, 4];
export const RANGE_SEPARATORS = ["/", "/", " - ", "/", "/"];
