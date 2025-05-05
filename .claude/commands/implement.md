Test-Driven Development (TDD)
1. Initial Test Writing:
    * For each task, write tests based on the expected input/output pairs.
    * Focus on meaningful scenarios, covering both positive cases (expected behavior) and negative cases (edge or error scenarios).
    * Avoid creating mock implementations, even for functionality that does not exist yet in the codebase.
2. Run the Tests:
    * Execute the written tests and confirm that they fail (to ensure the tests are working as intended).
3. Implementation Phase:
    * Write only the minimal amount of code required to pass the test case. Avoid writing excess or speculative code.
    * Iterate incrementally—one test case at a time.
4. Refinement and Generalization:
    * Once the tests pass, refactor the code for clarity, performance, and maintainability.
    * Ensure not to overfit implementation to the specific test cases. Aim for general, scalable solutions.
5. Ensure code passes linting and type checking
6. Final Verification:
    * Run all tests to ensure they pass successfully.


    ultrathink.