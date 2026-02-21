#!/usr/bin/gjs
/**
 * Runner for Arabic translation test - can run without GNOME Shell
 * Run with: gjs tests/run_translations_runner.js (from project root)
 */
import './test_translations_ar.js';
import * as testModule from './test_translations_ar.js';

const assert = (condition, message) => {
    if (!condition)
        throw new Error(`Assertion Failed: ${message}`);
    print(`  PASS: ${message}`);
};

testModule.runTests(assert);
print('All Arabic translation checks passed.');
