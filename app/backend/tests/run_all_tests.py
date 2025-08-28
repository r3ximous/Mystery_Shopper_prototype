#!/usr/bin/env python3
"""
Test Runner for Mystery Shopper Backend Tests
Runs all test files in the correct order
"""

import os
import sys
import subprocess
from pathlib import Path

def run_test(test_file):
    """Run a single test file"""
    print(f"\n{'='*60}")
    print(f"🧪 Running: {test_file}")
    print('='*60)
    
    try:
        result = subprocess.run([sys.executable, test_file], 
                              capture_output=False, 
                              text=True, 
                              cwd=Path(__file__).parent)
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error running {test_file}: {e}")
        return False

def main():
    """Run all tests in order"""
    test_dir = Path(__file__).parent
    
    # Test files in order of execution
    test_files = [
        'test_route_availability.py',
        'test_api.py', 
        'test_form_submission.py',
        'test_direct_submission.py',
        'test_admin_api_structure.py',
        'test_admin_verification.py'
    ]
    
    print("🚀 Mystery Shopper Backend Test Runner")
    print(f"📁 Test Directory: {test_dir}")
    print(f"📋 Running {len(test_files)} test files...")
    
    results = {}
    
    for test_file in test_files:
        test_path = test_dir / test_file
        if test_path.exists():
            success = run_test(test_path)
            results[test_file] = success
        else:
            print(f"⚠️  Test file not found: {test_file}")
            results[test_file] = False
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 TEST SUMMARY")
    print('='*60)
    
    passed = 0
    failed = 0
    
    for test_file, success in results.items():
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status}: {test_file}")
        if success:
            passed += 1
        else:
            failed += 1
    
    print(f"\n📈 Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All tests passed!")
        return 0
    else:
        print("💥 Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())