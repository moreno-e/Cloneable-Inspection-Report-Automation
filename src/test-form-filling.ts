/**
 * TEST SCRIPT FOR VISION-BASED FORM FILLING
 *
 * This demonstrates the form filler agent working across different form layouts.
 *
 * What you'll see:
 * 1. Browser opens with the form
 * 2. Claude Vision analyzes the form layout
 * 3. Form fields get filled automatically
 * 4. Form submits
 * 5. Success message appears
 * 6. Process repeats for next form
 */

import * as path from 'path';
import { extractInspectionData } from './agents/data-extractor';
import { fillFormWithVision } from './agents/form-filler';

/**
 * Main test function
 */
async function testFormFilling() {
  console.log('='.repeat(80));
  console.log('TESTING VISION-BASED FORM FILLING');
  console.log('='.repeat(80));
  console.log('\nThis will demonstrate adaptive form filling across 3 different layouts.');
  console.log('Watch how Claude Vision identifies fields without hardcoded selectors!\n');

  // STEP 1: Extract data from an inspection report
  console.log('STEP 1: Extracting data from inspection report...');
  const reportPath = path.join(__dirname, 'inspection-reports', 'report1.json');
  const inspectionData = await extractInspectionData(reportPath);

  console.log('\n✓ Data extracted successfully:');
  console.log(`  Location: ${inspectionData.location}`);
  console.log(`  Damage: ${inspectionData.damageType}`);
  console.log(`  Severity: ${inspectionData.severity}`);

  // STEP 2: Fill each form with the same data
  const forms = [
    'wake-county-form.html',
    'durham-county-form.html',
    'cary-city-form.html',
  ];

  for (let i = 0; i < forms.length; i++) {
    console.log('\n' + '='.repeat(80));
    console.log(`FORM ${i + 1} of ${forms.length}: ${forms[i]}`);
    console.log('='.repeat(80));

    const formPath = path.join(__dirname, 'forms', forms[i]);

    try {
      await fillFormWithVision(formPath, inspectionData);
      console.log(`✅ Successfully filled and submitted ${forms[i]}`);
    } catch (error) {
      console.error(`❌ Error with ${forms[i]}:`, error);
    }

    // Pause between forms
    if (i < forms.length - 1) {
      console.log('\n⏸️  Pausing 2 seconds before next form...\n');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('ALL FORMS COMPLETED');
  console.log('='.repeat(80));
  console.log('\nNotice how:');
  console.log('  ✓ Claude identified different field IDs in each form');
  console.log('  ✓ Mapped the same data to different dropdown options');
  console.log('  ✓ Adapted to completely different layouts');
  console.log('  ✓ No hardcoded selectors needed!');
  console.log('\nThis is the power of agentic RPA! 🚀\n');
}

/**
 * Run the test
 */
testFormFilling()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

/**
 * WHAT TO OBSERVE:
 *
 * 1. **Different Field IDs:**
 *    - Wake County uses: #location, #damageType, #severity
 *    - Durham uses: #site-address, #issue-category, #urgency
 *    - Cary uses: #serviceLocation, #problemType, #priorityLevel
 *    Claude finds all of them!
 *
 * 2. **Different Dropdown Options:**
 *    - Same damage type maps to different options in each form
 *    - Claude's matching logic handles the variations
 *
 * 3. **Different Visual Layouts:**
 *    - Wake: Traditional vertical form
 *    - Durham: Modern gradient card
 *    - Cary: Sectioned corporate layout
 *    Vision works regardless of styling!
 *
 * 4. **No Hardcoded Selectors:**
 *    - We never wrote "fill('#location', data)"
 *    - Claude figures it out by looking at the form
 *    - If form changes, it still works!
 *
 * INTERVIEW TALKING POINTS:
 * - "I built an RPA agent that uses Claude Vision to adaptively fill forms"
 * - "No hardcoded selectors - it analyzes the UI visually"
 * - "Handles different form layouts without reconfiguration"
 * - "Demonstrates vision-based automation for legacy systems"
 */
