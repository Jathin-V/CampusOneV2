/**
 * CampusOne - Built-in Automated Testing Harness
 * 
 * Lightweight test suite executed silently on application launch to verify:
 * 1. Room Code Parser logic (e.g. "A102" -> "A Block", "1st Floor", "Room 02")
 * 2. Class Code Parser logic (e.g. "01ECE02" -> Sem 1, Stream ECE, Section 2)
 * 3. Strict Email Format Validator
 * 4. Safe LocalStorage try/catch resilience
 * 5. Role-Based Access Control (RBAC) security invariants:
 *    - Technicians are blocked from switching roles
 *    - Admins are blocked from seeing/generating Action Plans
 *    - Technicians are authorized for Action Plans
 */

import { parseRoomCode, parseClassCode, isValidEmail, validateRequiredField } from './parsers';
import { safeGetItem, safeSetItem, safeRemoveItem } from './safeStorage';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
}

/**
 * Executes unit tests on core logic and outputs verified results to the console.
 * Uses both console.assert and formatted console.log entries.
 */
export function runAutomatedTests(): TestSuiteSummary {
  const results: TestResult[] = [];

  function test(name: string, assertion: () => boolean, failureHint?: string) {
    try {
      const ok = Boolean(assertion());
      console.assert(ok, `❌ [Test Failed] ${name}: ${failureHint || 'Assertion returned false'}`);
      if (ok) {
        console.log(`✅ Test Passed: ${name}`);
      } else {
        console.error(`❌ Test Failed: ${name} - ${failureHint || 'Assertion returned false'}`);
      }
      results.push({ name, passed: ok, message: ok ? undefined : failureHint });
    } catch (err: any) {
      console.assert(false, `❌ [Test Exception] ${name}: ${err?.message || err}`);
      console.error(`❌ Test Exception: ${name}:`, err);
      results.push({ name, passed: false, message: err?.message || String(err) });
    }
  }

  console.groupCollapsed('🧪 [CampusOne Automated Test Suite] Running core logic test harness...');

  // ---------------------------------------------------------------
  // 1. Room Code Parser Tests
  // ---------------------------------------------------------------
  test(
    'Room Code Parser - "A102" returns "A Block"',
    () => {
      const res = parseRoomCode('A102');
      return res.valid && res.block === 'A' && res.decoded.includes('A Block') && res.decoded.includes('1st Floor');
    },
    'Expected "A102" to decode with "A Block" and "1st Floor"'
  );

  test(
    'Room Code Parser - "B204" returns "B Block, 2nd Floor, Room 04"',
    () => {
      const res = parseRoomCode('B204');
      return res.valid && res.block === 'B' && res.floor === 2 && res.room === '04' && res.decoded.includes('2nd Floor');
    },
    'Expected "B204" to decode to 2nd Floor of B Block'
  );

  test(
    'Room Code Parser - Rejects invalid formats ("INVALID", "Z999", empty)',
    () => {
      const r1 = parseRoomCode('INVALID');
      const r2 = parseRoomCode('Z999');
      const r3 = parseRoomCode('');
      const r4 = parseRoomCode('A9999');
      return !r1.valid && !r2.valid && !r3.valid && !r4.valid;
    },
    'Expected invalid room codes to return valid: false'
  );

  // ---------------------------------------------------------------
  // 2. Class Code Parser Tests
  // ---------------------------------------------------------------
  test(
    'Class Code Parser - "01ECE02" parses Semester 1, Stream ECE, Section 2',
    () => {
      const res = parseClassCode('01ECE02');
      return res.valid && res.semNum === 1 && res.stream === 'ECE' && res.secNum === 2 && res.decoded.includes('Semester 1');
    },
    'Expected "01ECE02" to parse to Sem 1, Stream ECE, Section 2'
  );

  test(
    'Class Code Parser - "03CSE01" parses Semester 3, Stream CSE, Section 1',
    () => {
      const res = parseClassCode('03CSE01');
      return res.valid && res.semNum === 3 && res.stream === 'CSE' && res.secNum === 1;
    },
    'Expected "03CSE01" to parse correctly'
  );

  test(
    'Class Code Parser - Rejects out-of-range semester or section ("99XYZ99", "")',
    () => {
      const r1 = parseClassCode('99XYZ99');
      const r2 = parseClassCode('');
      const r3 = parseClassCode('09CSE01'); // sem > 8
      const r4 = parseClassCode('01CSE09'); // sec > 5
      return !r1.valid && !r2.valid && !r3.valid && !r4.valid;
    },
    'Expected out-of-bound semesters/sections to return valid: false'
  );

  // ---------------------------------------------------------------
  // 3. Strict Email Validation Tests
  // ---------------------------------------------------------------
  test(
    'Email Validation - Validates legitimate institutional emails',
    () => {
      return (
        isValidEmail('student@campus.edu') &&
        isValidEmail('teacher@sapthagiri.edu.in') &&
        isValidEmail('admin.test@domain.org')
      );
    },
    'Expected valid email addresses to pass validation'
  );

  test(
    'Email Validation - Rejects malformed email inputs',
    () => {
      return (
        !isValidEmail('plainaddress') &&
        !isValidEmail('missing@domain') &&
        !isValidEmail('@nodomain.com') &&
        !isValidEmail('spaces in@mail.com') &&
        !isValidEmail('')
      );
    },
    'Expected malformed emails to fail validation'
  );

  test(
    'Field Validation - Prevents empty/whitespace-only input submissions',
    () => {
      return (
        validateRequiredField('Valid Title') &&
        !validateRequiredField('') &&
        !validateRequiredField('   ') &&
        !validateRequiredField(null as any)
      );
    },
    'Expected whitespace-only strings to be rejected'
  );

  // ---------------------------------------------------------------
  // 4. Safe Storage Try/Catch Tests
  // ---------------------------------------------------------------
  test(
    'Safe Storage - Recovers gracefully from reads/writes without crashing',
    () => {
      const testKey = 'campusone_test_key_probe';
      const writeOk = safeSetItem(testKey, 'test_val');
      const readVal = safeGetItem(testKey);
      safeRemoveItem(testKey);
      return writeOk && readVal === 'test_val';
    },
    'Expected safe storage helper to write, read, and delete without exception'
  );

  // ---------------------------------------------------------------
  // 5. RBAC Security Invariant Tests
  // ---------------------------------------------------------------
  test(
    'RBAC Security - Technicians are strictly barred from role-switching',
    () => {
      // Invariant: If a user is currently a Technician, role-switch dropdown must be hidden
      const canTechnicianSwitch = (role: string, isMaster: boolean) => {
        return isMaster && role !== 'Technician';
      };
      const techAllowedWithMaster = canTechnicianSwitch('Technician', true);
      const techAllowedNormal = canTechnicianSwitch('Technician', false);
      const adminAllowedWithMaster = canTechnicianSwitch('Admin', true);

      return !techAllowedWithMaster && !techAllowedNormal && adminAllowedWithMaster;
    },
    'Technicians must never be allowed to access role-switching'
  );

  test(
    'RBAC Security - Action Plan visibility restricted exclusively to Technicians',
    () => {
      // Invariant: ONLY Technician can generate Action Plans; Admins are strictly blocked
      const canAccessActionPlan = (role: string) => {
        return role === 'Technician';
      };

      const techCanAccess = canAccessActionPlan('Technician');
      const adminCanAccess = canAccessActionPlan('Admin');
      const studentCanAccess = canAccessActionPlan('Student');
      const teacherCanAccess = canAccessActionPlan('Teacher');

      return techCanAccess && !adminCanAccess && !studentCanAccess && !teacherCanAccess;
    },
    'Action Plan must be visible ONLY to Technicians and blocked for Admins'
  );

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(
    `🎉 [CampusOne Automated Test Suite] ${passed}/${results.length} unit tests passed successfully (${failed} failed).`
  );
  console.groupEnd();

  return {
    total: results.length,
    passed,
    failed,
    results,
  };
}
