import assert from 'node:assert/strict';
import { getNavigationItemsForRole } from '../src/utils/navigationConfig.js';

console.log('🧪 Starting Role-to-Navigation Mapping Regression Test Suite...\n');

let totalTests = 0;
let passedTests = 0;

function runTest(testName, testFunction) {
  totalTests++;
  try {
    testFunction();
    passedTests++;
    console.log(`✅ PASS [${totalTests}]: ${testName}`);
  } catch (assertionError) {
    console.error(`❌ FAIL [${totalTests}]: ${testName}`);
    console.error(assertionError);
    throw assertionError;
  }
}

// ── Test 1: STUDENT Navigation
runTest('STUDENT role receives only student items with Personal Profile and never administrative items', () => {
  const items = getNavigationItemsForRole('STUDENT');
  const paths = items.map((item) => item.path);

  assert.strictEqual(items.length, 5, 'Student should receive exactly 5 navigation items');
  assert.ok(paths.includes('/dashboard'), 'Student must have /dashboard');
  assert.ok(paths.includes('/attendance'), 'Student must have /attendance');
  assert.ok(paths.includes('/holidays'), 'Student must have /holidays');
  assert.ok(paths.includes('/documents'), 'Student must have /documents');
  assert.ok(paths.includes('/profile'), 'Student must have /profile');

  const profileItem = items.find((item) => item.path === '/profile');
  assert.strictEqual(profileItem?.label, 'Personal Profile', 'Student profile label must be Personal Profile');

  assert.ok(!paths.includes('/schools'), 'Student must NOT have /schools');
  assert.ok(!paths.includes('/users'), 'Student must NOT have /users');
  assert.ok(!paths.includes('/approvals'), 'Student must NOT have /approvals');
  assert.ok(!paths.includes('/audit-logs'), 'Student must NOT have /audit-logs');
});

// ── Test 2: TEACHER Navigation (Regression Guard for Bug Fix)
runTest('TEACHER role receives teacher workspace items with School Directory & Personal Profile, and NEVER administrative items', () => {
  const items = getNavigationItemsForRole('TEACHER');
  const paths = items.map((item) => item.path);

  assert.strictEqual(items.length, 10, 'Teacher should receive exactly 10 navigation items');
  assert.ok(paths.includes('/dashboard'), 'Teacher must have /dashboard');
  assert.ok(paths.includes('/my-classes'), 'Teacher must have /my-classes');
  assert.ok(paths.includes('/directory'), 'Teacher must have School Directory');
  assert.ok(paths.includes('/dashboard?tab=attendance'), 'Teacher must have Daily Attendance');
  assert.ok(paths.includes('/dashboard?tab=exams'), 'Teacher must have Exam Marks');
  assert.ok(paths.includes('/dashboard?tab=homework'), 'Teacher must have Homework');
  assert.ok(paths.includes('/dashboard?tab=timetable'), 'Teacher must have Timetable');
  assert.ok(paths.includes('/dashboard?tab=circulars'), 'Teacher must have Notice Board');
  assert.ok(!paths.includes('/dashboard?tab=service'), 'Teacher must NOT have redundant /dashboard?tab=service (consolidated into /profile)');
  assert.ok(paths.includes('/holidays'), 'Teacher must have Holidays & Calendar');
  assert.ok(paths.includes('/profile'), 'Teacher must have Personal Profile');

  const directoryItem = items.find((item) => item.path === '/directory');
  assert.strictEqual(directoryItem?.label, 'School Directory', 'Teacher directory label must be School Directory');

  const profileItem = items.find((item) => item.path === '/profile');
  assert.strictEqual(profileItem?.label, 'Personal Profile', 'Teacher profile label must be Personal Profile');

  // CRITICAL REGRESSION ASSERTION: Teacher must never fall into Admin menu
  assert.ok(!paths.includes('/schools'), 'Teacher must NOT receive /schools');
  assert.ok(!paths.includes('/users'), 'Teacher must NOT receive /users (Account governance)');
  assert.ok(!paths.includes('/approvals'), 'Teacher must NOT receive /approvals');
  assert.ok(!paths.includes('/audit-logs'), 'Teacher must NOT receive /audit-logs');
});

// ── Test 3: PARENT Navigation (Parent Isolation Guard)
runTest('PARENT role receives only parent workspace items and NEVER Personal Profile', () => {
  const items = getNavigationItemsForRole('PARENT');
  const paths = items.map((item) => item.path);

  assert.strictEqual(items.length, 5, 'Parent should receive exactly 5 navigation items');
  assert.ok(paths.includes('/dashboard'), 'Parent must have /dashboard');
  assert.ok(paths.includes('/attendance'), 'Parent must have /attendance');
  assert.ok(paths.includes('/exams'), 'Parent must have /exams');
  assert.ok(paths.includes('/holidays'), 'Parent must have /holidays');
  assert.ok(paths.includes('/documents'), 'Parent must have /documents');

  // PARENT ISOLATION MANDATE: Parents do not receive Personal Profile in sidebar
  assert.ok(!paths.includes('/profile'), 'Parent must NOT have Personal Profile in sidebar');
  assert.ok(!paths.includes('/schools'), 'Parent must NOT have /schools');
  assert.ok(!paths.includes('/users'), 'Parent must NOT have /users');
  assert.ok(!paths.includes('/approvals'), 'Parent must NOT have /approvals');
});

// ── Test 4: HM Navigation
runTest('HM role receives institutional administration items without central governance (/users)', () => {
  const items = getNavigationItemsForRole('HM');
  const paths = items.map((item) => item.path);

  assert.strictEqual(items.length, 14, 'HM should receive exactly 14 navigation items');
  assert.ok(paths.includes('/dashboard'), 'HM must have /dashboard');
  assert.ok(paths.includes('/directory?tab=students'), 'HM must have student directory');
  assert.ok(paths.includes('/directory?tab=staff'), 'HM must have teaching staff directory');
  assert.ok(paths.includes('/approvals'), 'HM must have approvals queue');
  assert.ok(paths.includes('/dashboard?tab=profile'), 'HM must have school profile');

  // HM cannot access global central account governance
  assert.ok(!paths.includes('/users'), 'HM must NOT have /users (central account governance)');
  assert.ok(!paths.includes('/audit-logs'), 'HM must NOT have /audit-logs');
});

// ── Test 5: SUPERVISOR Navigation
runTest('SUPERVISOR role receives cluster supervision items without central approvals or account governance', () => {
  const items = getNavigationItemsForRole('SUPERVISOR');
  const paths = items.map((item) => item.path);

  assert.strictEqual(items.length, 9, 'Supervisor should receive exactly 9 navigation items');
  assert.ok(paths.includes('/dashboard'), 'Supervisor must have /dashboard');
  assert.ok(paths.includes('/schools'), 'Supervisor must have /schools');
  assert.ok(paths.includes('/directory'), 'Supervisor must have /directory');
  assert.ok(paths.includes('/attendance'), 'Supervisor must have /attendance');
  assert.ok(paths.includes('/transfers'), 'Supervisor must have /transfers');

  assert.ok(!paths.includes('/users'), 'Supervisor must NOT have /users');
  assert.ok(!paths.includes('/approvals'), 'Supervisor must NOT have /approvals');
  assert.ok(!paths.includes('/audit-logs'), 'Supervisor must NOT have /audit-logs');
});

// ── Test 6: ADMIN Navigation
runTest('ADMIN role receives town administration navigation without platform audit logs', () => {
  const items = getNavigationItemsForRole('ADMIN');
  const paths = items.map((item) => item.path);

  assert.strictEqual(items.length, 11, 'Admin should receive exactly 11 navigation items');
  assert.ok(paths.includes('/schools'), 'Admin must have /schools');
  assert.ok(paths.includes('/users'), 'Admin must have /users');
  assert.ok(paths.includes('/approvals'), 'Admin must have /approvals');
  assert.ok(!paths.includes('/audit-logs'), 'Standard Admin must NOT have /audit-logs');
});

// ── Test 7: SUPER_ADMIN & ROOT_ADMIN Navigation
runTest('SUPER_ADMIN and ROOT_ADMIN receive full administration including /audit-logs', () => {
  for (const role of ['SUPER_ADMIN', 'ROOT_ADMIN']) {
    const items = getNavigationItemsForRole(role);
    const paths = items.map((item) => item.path);

    assert.strictEqual(items.length, 12, `${role} should receive 12 navigation items`);
    assert.ok(paths.includes('/schools'), `${role} must have /schools`);
    assert.ok(paths.includes('/users'), `${role} must have /users`);
    assert.ok(paths.includes('/approvals'), `${role} must have /approvals`);
    assert.ok(paths.includes('/audit-logs'), `${role} must have /audit-logs`);
  }
});

// ── Test 8: PEON Navigation
runTest('PEON role receives operational logistics navigation only', () => {
  const items = getNavigationItemsForRole('PEON');
  const paths = items.map((item) => item.path);

  assert.strictEqual(items.length, 5, 'Peon should receive exactly 5 navigation items');
  assert.ok(paths.includes('/dashboard'), 'Peon must have /dashboard');
  assert.ok(paths.includes('/attendance'), 'Peon must have /attendance');
  assert.ok(paths.includes('/documents'), 'Peon must have /documents');
  assert.ok(paths.includes('/holidays'), 'Peon must have /holidays');
  assert.ok(paths.includes('/profile'), 'Peon must have /profile');

  assert.ok(!paths.includes('/schools'), 'Peon must NOT have /schools');
  assert.ok(!paths.includes('/users'), 'Peon must NOT have /users');
  assert.ok(!paths.includes('/approvals'), 'Peon must NOT have /approvals');
});

// ── Test 9: Unknown / Unrecognized Role (Fail-Safe Default)
runTest('Unrecognized role does NOT receive administrator items and gets safe self-service fallback', () => {
  const unknownRoles = ['GUEST', 'CONTRACTOR', 'OBSERVER', null, undefined, ''];
  for (const role of unknownRoles) {
    const items = getNavigationItemsForRole(role);
    const paths = items.map((item) => item.path);

    assert.strictEqual(items.length, 4, `Unknown role ${role} should receive exactly 4 fallback items`);
    assert.ok(paths.includes('/dashboard'), 'Fallback must have /dashboard');
    assert.ok(paths.includes('/holidays'), 'Fallback must have /holidays');
    assert.ok(paths.includes('/documents'), 'Fallback must have /documents');
    assert.ok(paths.includes('/profile'), 'Fallback must have /profile');

    assert.ok(!paths.includes('/schools'), `Role ${role} must NOT receive /schools`);
    assert.ok(!paths.includes('/users'), `Role ${role} must NOT receive /users`);
    assert.ok(!paths.includes('/approvals'), `Role ${role} must NOT receive /approvals`);
    assert.ok(!paths.includes('/audit-logs'), `Role ${role} must NOT receive /audit-logs`);
  }
});

console.log(`\n🎉 ALL ${passedTests}/${totalTests} ROLE-TO-NAVIGATION REGRESSION TESTS PASSED!`);
