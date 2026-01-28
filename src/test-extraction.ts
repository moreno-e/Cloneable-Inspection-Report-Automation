/**
 * TEST SCRIPT FOR DATA EXTRACTION
 *
 * This script tests our data extraction agent by processing all three
 * inspection reports and showing the extracted data.
 *
 * Run with: npm start (or npm run dev for auto-reload)
 */

import * as path from 'path';
import { extractInspectionData } from './agents/data-extractor';

/**
 * Main test function
 *
 * This demonstrates the agent processing multiple report formats.
 */
async function testDataExtraction() {
  console.log('='.repeat(80));
  console.log('TESTING DATA EXTRACTION AGENT');
  console.log('='.repeat(80));

  // Array of all our test reports
  const reportFiles = [
    'report1.json',  // Structured drone report
    'report2.txt',   // Text-based sensor report
    'report3.json',  // Different JSON schema from robot
  ];

  // Process each report
  for (const reportFile of reportFiles) {
    const reportPath = path.join(__dirname, 'inspection-reports', reportFile);

    try {
      // Call our extraction agent
      const data = await extractInspectionData(reportPath);

      // Display the results
      console.log('\n' + '─'.repeat(80));
      console.log(`📋 Extracted Data from ${reportFile}:`);
      console.log('─'.repeat(80));
      console.log(JSON.stringify(data, null, 2));

    } catch (error) {
      console.error(`\n❌ Error processing ${reportFile}:`, error);
    }

    // Add spacing between reports
    console.log('\n');
  }

  console.log('='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
}

/**
 * Error handling wrapper
 *
 * Catches any uncaught errors and logs them nicely.
 */
testDataExtraction()
  .then(() => {
    console.log('\n✅ All tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

/**
 * WHAT TO OBSERVE WHEN RUNNING THIS:
 *
 * 1. Claude reads three COMPLETELY DIFFERENT formats:
 *    - report1.json: Clean nested JSON with "findings" object
 *    - report2.txt: Free-form text with headers
 *    - report3.json: Different JSON schema with different field names
 *
 * 2. All three get normalized into the SAME output structure (InspectionData)
 *
 * 3. Claude intelligently maps severity:
 *    - "Moderate" → "medium"
 *    - "High (Priority 1)" → "high"
 *    - "Medium" → "medium"
 *
 * 4. Field names don't matter:
 *    - "address" vs "location_data.full_address" → both become "location"
 *    - "observations" vs "detailed_notes" → both become "notes"
 *
 * This is the power of AI-based extraction vs traditional parsing!
 */
