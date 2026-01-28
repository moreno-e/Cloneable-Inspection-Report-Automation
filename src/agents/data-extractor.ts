/**
 * DATA EXTRACTION AGENT
 *
 * This agent's job: Read ANY format of inspection report and extract structured data.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { callClaude } from '../utils/claude-client';
import { InspectionData } from '../utils/types';
import {EXTRACTION_SYSTEM_PROMPT} from './data-extractor-prompt'

/**
 * extractInspectionData - Main function that reads a report file and extracts data
 *
 * @param reportPath - Path to the inspection report file
 * @returns Promise<InspectionData> - Structured inspection data
 *
 * FLOW:
 * 1. Read the file from disk
 * 2. Send content to Claude with extraction prompt
 * 3. Parse Claude's JSON response
 * 4. Validate and return structured data
 */
export async function extractInspectionData(
  reportPath: string
): Promise<InspectionData> {
  console.log(`\n📄 Reading inspection report: ${path.basename(reportPath)}`);

  // STEP 1: Read the raw report file
  const reportContent = await fs.readFile(reportPath, 'utf-8');

  console.log(`📊 Report size: ${reportContent.length} characters`);
  console.log(`🤖 Sending to Claude for extraction...`);

  // STEP 2: Create the user prompt - what we're asking Claude to do with THIS specific report
  const userPrompt = `Extract the inspection data from this report:\n\n${reportContent}`;

  // STEP 3: Call Claude API - callClaude sends the prompt and waits for response
  const response = await callClaude(
    userPrompt,
    EXTRACTION_SYSTEM_PROMPT,
    1024 // max tokens for response
  );

  console.log(`✅ Received response from Claude`);

  // STEP 4: Clean the response (remove markdown code blocks if present)
  // Claude sometimes wraps JSON in ```json ... ``` blocks
  let cleanedResponse = response.trim();
  
  if (cleanedResponse.startsWith('```')) {
    // Remove opening ```json or ```
    cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/, '');
    // Remove closing ```
    cleanedResponse = cleanedResponse.replace(/\n?```\s*$/, '');
    cleanedResponse = cleanedResponse.trim();
  }

  // STEP 5: Parse Claude's response as JSON
  // Claude should return JSON, but we need error handling in case it doesn't
  try {
    const extractedData: InspectionData = JSON.parse(cleanedResponse);

    // STEP 6: Validate the data
    // Make sure Claude gave us all required fields
    if (!extractedData.location || !extractedData.damageType ||
        !extractedData.severity || !extractedData.notes) {
      throw new Error('Missing required fields in extracted data');
    }

    // Validate severity is one of our allowed values
    if (!['low', 'medium', 'high'].includes(extractedData.severity)) {
      throw new Error(`Invalid severity level: ${extractedData.severity}`);
    }

    console.log(`✓ Extracted data successfully:`);
    console.log(`  Location: ${extractedData.location}`);
    console.log(`  Damage: ${extractedData.damageType}`);
    console.log(`  Severity: ${extractedData.severity.toUpperCase()}`);

    return extractedData;

  } catch (error) {
    console.error('❌ Failed to parse extraction response:', error);
    console.error('Claude response was:', response);
    
    throw new Error('Failed to extract valid data from report');
  }
}
