"""
This script runs the test suite, allowing for selection of test types (unit, integration, system).
"""

import pytest
import sys
import os
from typing import List

def run_tests(test_types: List[str] = None) -> int:
    """
    Run specified types of tests.
    
    Args:
        test_types: List of test types to run ('unit', 'integration', 'system')
    Returns:
        Exit code (0 for success, 1 for failure)
    """
    if test_types is None:
        test_types = ['unit', 'integration', 'system']

    test_paths = []
    for test_type in test_types:
        if test_type in ['unit', 'integration', 'system']:
            test_paths.append(f'tests/{test_type}/')

    if not test_paths:
        print("No valid test types specified")
        return 1

    args = [
        '-v',
        '--cov=app',
        '--cov-report=term-missing',
    ] + test_paths

    return pytest.main(args)

if __name__ == '__main__':
    # Get test types from command line args
    test_types = sys.argv[1:] if len(sys.argv) > 1 else None
    sys.exit(run_tests(test_types)) 