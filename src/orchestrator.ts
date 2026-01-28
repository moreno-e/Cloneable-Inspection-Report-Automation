/**
 * MAIN ORCHESTRATOR - THE COMPLETE AGENTIC RPA SYSTEM
 *
 * This is the "brain" that coordinates all the agents to accomplish
 * the full end-to-end task.
 *
 * WHAT IT DOES:
 * 1. Read inspection reports from field devices
 * 2. Extract structured data (data-extractor agent)
 * 3. For each county permit system:
 *    - Open the form
 *    - Use vision to identify fields (form-filler agent)
 *    - Fill and submit
 * 4. Track results and provide summary
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { extractInspectionData } from './agents/data-extractor';
import { fillFormWithVision } from './agents/form-filler';
import { InspectionData } from './utils/types';

/**
 * Result tracking for each form submission
 *
 * This helps us track success/failure for monitoring and debugging
 */
interface FormSubmissionResult {
  formName: string;
  success: boolean;
  error?: string;
  timestamp: Date;
}

/**
 * Overall job result
 *
 * Tracks the entire workflow from report → multiple form submissions
 */
interface OrchestrationResult {
  reportId: string;
  reportFile: string;
  extractedData: InspectionData;
  formResults: FormSubmissionResult[];
  totalForms: number;
  successfulSubmissions: number;
  failedSubmissions: number;
  startTime: Date;
  endTime: Date;
  durationMs: number;
}

/**
 * MAIN ORCHESTRATOR FUNCTION
 *
 * This is the entry point that coordinates the entire workflow.
 *
 * @param reportPath - Path to inspection report file
 * @param formPaths - Array of form HTML file paths
 * @returns OrchestrationResult with detailed results
 *
 * ORCHESTRATION PATTERN:
 * 1. Sequential data extraction (must happen first)
 * 2. Parallel form filling (forms can be filled independently)
 *    - In this demo we do them sequentially to see each one
 *    - In production, you'd parallelize for speed
 * 3. Result aggregation and reporting
 */
export async function orchestrateInspectionWorkflow(
  reportPath: string,
  formPaths: string[]
): Promise<OrchestrationResult> {
  const startTime = new Date();

  console.log('\n' + '═'.repeat(80));
  console.log('🤖 AGENTIC RPA ORCHESTRATION - STARTING WORKFLOW');
  console.log('═'.repeat(80));
  console.log(`\n📊 Workflow Configuration:`);
  console.log(`   Report: ${path.basename(reportPath)}`);
  console.log(`   Target Forms: ${formPaths.length}`);
  
  formPaths.forEach((fp, i) => {
    console.log(`     ${i + 1}. ${path.basename(fp)}`);
  });

  /**
   * STEP 1: DATA EXTRACTION
   *
   * Use the data-extractor agent to read and parse the inspection report.
   * This is a BLOCKING step - we need the data before we can fill forms.
   */
  console.log('\n' + '─'.repeat(80));
  console.log('STEP 1: DATA EXTRACTION');
  console.log('─'.repeat(80));

  let extractedData: InspectionData;

  try {
    extractedData = await extractInspectionData(reportPath);

    console.log('\n✅ Data extraction successful!');
    console.log(`\n📋 Extracted Information:`);
    console.log(`   Location: ${extractedData.location}`);
    console.log(`   Damage Type: ${extractedData.damageType}`);
    console.log(`   Severity: ${extractedData.severity.toUpperCase()}`);
    console.log(`   Notes: ${extractedData.notes.substring(0, 100)}...`);
    
    if (extractedData.reportId) {
      console.log(`   Report ID: ${extractedData.reportId}`);
    }
  } catch (error) {
    console.error('\n❌ FATAL: Data extraction failed');
    console.error(error);

    throw new Error('Cannot proceed without extracted data');
  }

  /**
   * STEP 2: FORM FILLING
   *
   * For each target form, use the form-filler agent to:
   * - Open form in browser
   * - Analyze with Claude Vision
   * - Fill fields adaptively
   * - Submit
   *
   * PRODUCTION NOTE: You could parallelize this with Promise.all() for speed.
   * We do it sequentially here so you can watch each one happen.
   */
  console.log('\n' + '─'.repeat(80));
  console.log('STEP 2: FORM SUBMISSION');
  console.log('─'.repeat(80));
  console.log(`\nSubmitting to ${formPaths.length} permit systems...\n`);

  const formResults: FormSubmissionResult[] = [];

  for (let i = 0; i < formPaths.length; i++) {
    const formPath = formPaths[i];
    const formName = path.basename(formPath);

    console.log('\n' + '┌'.repeat(80));
    console.log(`📝 Form ${i + 1} of ${formPaths.length}: ${formName}`);
    console.log('└'.repeat(80));

    const formStartTime = new Date();

    try {
      // Call the form-filler agent
      await fillFormWithVision(formPath, extractedData);

      const formEndTime = new Date();
      const formDuration = formEndTime.getTime() - formStartTime.getTime();

      formResults.push({
        formName,
        success: true,
        timestamp: formEndTime,
      });

      console.log(`\n✅ ${formName} submitted successfully! (${formDuration}ms)`);
    } catch (error) {
      const formEndTime = new Date();

      formResults.push({
        formName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: formEndTime,
      });

      console.error(`\n❌ ${formName} failed:`, error);
    }

    // Pause between forms (optional, helps with visual demo)
    if (i < formPaths.length - 1) {
      console.log('\n⏸️  Pausing 2 seconds before next form...');
      
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  /**
   * STEP 3: RESULTS AGGREGATION
   *
   * Analyze the results and provide a summary.
   * In production, you'd log this to a database, send alerts, etc.
   */
  const endTime = new Date();
  const durationMs = endTime.getTime() - startTime.getTime();

  const successfulSubmissions = formResults.filter((r) => r.success).length;
  const failedSubmissions = formResults.filter((r) => !r.success).length;

  const result: OrchestrationResult = {
    reportId: extractedData.reportId || 'N/A',
    reportFile: path.basename(reportPath),
    extractedData,
    formResults,
    totalForms: formPaths.length,
    successfulSubmissions,
    failedSubmissions,
    startTime,
    endTime,
    durationMs,
  };

  /**
   * STEP 4: FINAL REPORT
   *
   * Display comprehensive results to the user/operator
   */
  console.log('\n' + '═'.repeat(80));
  console.log('🎯 WORKFLOW COMPLETE - FINAL REPORT');
  console.log('═'.repeat(80));

  console.log(`\n📊 Summary:`);
  console.log(`   Report Processed: ${result.reportFile}`);
  console.log(`   Total Forms: ${result.totalForms}`);
  console.log(`   ✅ Successful: ${result.successfulSubmissions}`);
  console.log(`   ❌ Failed: ${result.failedSubmissions}`);
  console.log(`   ⏱️  Total Duration: ${(result.durationMs / 1000).toFixed(2)}s`);

  console.log(`\n📋 Detailed Results:`);
  
  formResults.forEach((fr, i) => {
    const status = fr.success ? '✅' : '❌';
    const errorMsg = fr.error ? ` (Error: ${fr.error})` : '';
    console.log(`   ${status} ${i + 1}. ${fr.formName}${errorMsg}`);
  });

  console.log('\n' + '═'.repeat(80));

  // Success/failure emoji based on results
  if (failedSubmissions === 0) {
    console.log('🎉 ALL SUBMISSIONS SUCCESSFUL!');
  } else if (successfulSubmissions > 0) {
    console.log('⚠️  PARTIALLY SUCCESSFUL - Some submissions failed');
  } else {
    console.log('❌ ALL SUBMISSIONS FAILED');
  }

  console.log('═'.repeat(80) + '\n');

  return result;
}