/**
 * CampusOne - Core Parsers & Validation Logic
 * Provides deterministic parsing and validation for room codes, class codes, and form inputs.
 */

export interface RoomParseResult {
  valid: boolean;
  decoded: string;
  block?: string;
  floor?: number;
  room?: string;
}

/**
 * Room Code Parser:
 * e.g. "A102" -> "A Block, 1st Floor, Room 02"
 * Supports Blocks A/B/C, Floors 1-12, Rooms 01-26
 */
export function parseRoomCode(raw: string): RoomParseResult {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, decoded: 'Enter Room Code (e.g. A102, B204)' };
  }

  const clean = raw.trim().toUpperCase();
  if (!clean) {
    return { valid: false, decoded: 'Enter Room Code (e.g. A102, B204)' };
  }

  const match = clean.match(/^([ABC])(\d{1,2})(\d{2})$/);
  if (!match) {
    return { valid: false, decoded: 'Invalid format. Use [Block][Floor][Room] e.g. A102, B204' };
  }

  const block = match[1];
  const floorNum = parseInt(match[2], 10);
  const roomNum = parseInt(match[3], 10);

  if (floorNum < 1 || floorNum > 12) {
    return { valid: false, decoded: 'Floor must be between 1 and 12' };
  }
  if (roomNum < 1 || roomNum > 26) {
    return { valid: false, decoded: 'Room must be between 01 and 26' };
  }

  const floorOrdinal =
    floorNum === 1
      ? '1st Floor'
      : floorNum === 2
      ? '2nd Floor'
      : floorNum === 3
      ? '3rd Floor'
      : `${floorNum}th Floor`;

  return {
    valid: true,
    block,
    floor: floorNum,
    room: match[3],
    decoded: `${block} Block, ${floorOrdinal}, Room ${match[3]}`,
  };
}

export interface ClassParseResult {
  valid: boolean;
  decoded: string;
  semNum?: number;
  stream?: string;
  secNum?: number;
}

/**
 * Class Code Parser:
 * e.g. "01ECE02" -> "Semester 1, Stream ECE, Section 2"
 * Logic: 2-digit sem (01-08), string stream (2-6 chars), 2-digit section (01-05)
 */
export function parseClassCode(raw: string): ClassParseResult {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, decoded: 'Enter Class Code (e.g. 01ECE02)' };
  }

  const clean = raw.trim().toUpperCase();
  if (!clean) {
    return { valid: false, decoded: 'Enter Class Code (e.g. 01ECE02)' };
  }

  const match = clean.match(/^(\d{2})([A-Z]{2,6})(\d{2})$/);
  if (!match) {
    return { valid: false, decoded: 'Format: [2-digit Sem][Stream][2-digit Section] e.g. 01ECE02' };
  }

  const semNum = parseInt(match[1], 10);
  const stream = match[2];
  const secNum = parseInt(match[3], 10);

  if (semNum < 1 || semNum > 8) {
    return { valid: false, decoded: 'Semester must be 01 to 08' };
  }
  if (secNum < 1 || secNum > 5) {
    return { valid: false, decoded: 'Section must be 01 to 05' };
  }

  return {
    valid: true,
    decoded: `Semester ${semNum}, Stream ${stream}, Section ${secNum}`,
    semNum,
    stream,
    secNum,
  };
}

/**
 * Strict Email Validation:
 * Validates RFC-compliant email structure with user and domain checks
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim();
  if (clean.length < 5 || clean.length > 254) return false;
  // Standard strict regex avoiding empty domains or missing tld
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(clean);
}

/**
 * Strict String / Field Validation:
 * Prevents empty or whitespace-only inputs
 */
export function validateRequiredField(value: string | undefined | null, minLength: number = 1): boolean {
  if (!value) return false;
  return value.trim().length >= minLength;
}
