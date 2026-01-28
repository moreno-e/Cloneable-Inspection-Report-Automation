import * as path from 'path';
import { orchestrateInspectionWorkflow } from './orchestrator';

const DEMO_SCENARIOS = {
  /**
   * Scenario 1: Power pole damage (moderate severity)
   * File permits with all 3 county systems
   */
  scenario1: {
    name: 'Power Pole Damage - Multi-County Filing',
    reportPath: path.join(__dirname, 'inspection-reports', 'report1.json'),
    formPaths: [
      path.join(__dirname, 'forms', 'wake-county-form.html'),
      path.join(__dirname, 'forms', 'durham-county-form.html'),
      path.join(__dirname, 'forms', 'cary-city-form.html'),
    ],
  },

  /**
   * Scenario 2: High-priority transformer issue (text report)
   * File with Durham County only (where transformer is located)
   */
  scenario2: {
    name: 'Critical Transformer Issue - Durham County',
    reportPath: path.join(__dirname, 'inspection-reports', 'report2.txt'),
    formPaths: [path.join(__dirname, 'forms', 'durham-county-form.html')],
  },

  /**
   * Scenario 3: Cell tower maintenance (different JSON schema)
   * File with Cary City (where tower is located)
   */
  scenario3: {
    name: 'Cell Tower Maintenance - Cary City',
    reportPath: path.join(__dirname, 'inspection-reports', 'report3.json'),
    formPaths: [path.join(__dirname, 'forms', 'cary-city-form.html')],
  },
};


async function main() {
  console.log('\n🚀 AGENTIC RPA SYSTEM - INSPECTION REPORT AUTOMATION\n');

  /**
   * Change this to run different scenarios:
   * - 'scenario1': Complete demo with all 3 forms (best for interviews)
   * - 'scenario2': Quick demo with 1 form (faster)
   * - 'scenario3': Different report format demo
   */
  const SELECTED_SCENARIO = 'scenario1'; // <-- CHANGE THIS TO TRY DIFFERENT SCENARIOS
  const scenario = DEMO_SCENARIOS[SELECTED_SCENARIO];

  console.log(`📋 Running: ${scenario.name}`);
  console.log(`   Report: ${path.basename(scenario.reportPath)}`);
  console.log(`   Forms: ${scenario.formPaths.length}`);
  console.log('');

  try {
    // Run the orchestration
    const result = await orchestrateInspectionWorkflow(
      scenario.reportPath,
      scenario.formPaths
    );

    // Exit with appropriate code
    if (result.failedSubmissions === 0) {
      console.log('\n✅ All operations completed successfully!\n');

      process.exit(0);
    } else {
      console.log('\n⚠️  Some operations failed. Check logs above.\n');

      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error during orchestration:', error);

    process.exit(1);
  }
}

// Run the main function
main();
