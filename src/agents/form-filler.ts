/**
 * FORM FILLING AGENT WITH VISION
 *
 * This agent uses Claude Vision to "see" forms and fill them adaptively.
 *
 * Claude Vision looks at the form and figures out where fields are,
 * adapting to different layouts without hardcoded selectors.
 */

import { chromium, Browser, Page, Locator } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import { anthropic, MODEL } from '../utils/claude-client';
import { InspectionData, FormField } from '../utils/types';
import {VISION_SYSTEM_PROMPT} from './form-filler-vision-prompt'

type SelectOption = { value: string; text: string };

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cssEscapeIdentifier(input: string): string {
  // Minimal CSS identifier escape for common cases (ids/names in these demo forms).
  return input.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

/**
 * Opens a form in a browser and takes a screenshot
 *
 * @param formPath - Path to the HTML form file
 * @returns Screenshot buffer and Page object
 *
 * PLAYWRIGHT CONCEPTS:
 * - Browser: The actual browser instance (like opening Chrome)
 * - Page: A tab in the browser
 * - We use 'file://' protocol to open local HTML files
 */
async function openFormAndScreenshot(
  formPath: string
): Promise<{ screenshot: Buffer; page: Page; browser: Browser }> {
  
  console.log(`\n🌐 Opening form: ${path.basename(formPath)}`);

  // Launch Chromium browser
  // headless: false = see the browser (useful for debugging)
  // headless: true = run in background (faster, for production)
  const browser = await chromium.launch({
    headless: false, // Set to true for production
  });

  // Create a new page (tab)
  const page = await browser.newPage();

  // Navigate to the form
  // We use file:// protocol to load local HTML files
  const fileUrl = `file://${formPath}`;
  
  await page.goto(fileUrl);

  console.log(`📸 Taking screenshot for vision analysis...`);

  // Take screenshot and return as buffer
  // Buffer = raw binary data that we'll send to Claude Vision
  const screenshot = await page.screenshot({
    fullPage: true, // Capture entire page, not just viewport
  });

  return { screenshot, page, browser };
}

/**
 * Uses Claude Vision to analyze form screenshot and identify fields
 *
 * @param screenshot - Screenshot buffer from Playwright
 * @returns Array of identified form fields
 *
 * CLAUDE VISION API:
 * - Can process images alongside text
 * - Understands visual layout, labels, form structure
 * - Returns text description of what it sees
 */
async function analyzeFormWithVision(
  screenshot: Buffer
): Promise<FormField[]> {
  console.log(`👁️  Analyzing form with Claude Vision...`);

  /**
   * IMAGE FORMAT FOR CLAUDE
   *
   * Claude expects images as base64-encoded strings.
   * Base64 = way to represent binary data (like images) as text.
   *
   * Why base64?
   * - JSON doesn't support binary data
   * - APIs typically use text-based protocols (HTTP/JSON)
   * - base64 converts binary → text that can go in JSON
   */
  const base64Screenshot = screenshot.toString('base64');

  /**
   * VISION API CALL
   *
   * Key differences from text-only API:
   * 1. content array can include both text and images
   * 2. image object has source.type and source.data
   * 3. media_type tells Claude it's a PNG image
   */
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: VISION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Screenshot,
            },
          },
          {
            type: 'text',
            text: 'Analyze this form and identify the fields where I should enter inspection data. Return the JSON array of field mappings.',
          },
        ],
      },
    ],
  });

  // Extract text response
  const textContent = response.content.find((block) => block.type === 'text');
  
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude Vision');
  }

  console.log(`✅ Received field mappings from Claude`);

  // Clean response (remove markdown if present)
  let cleanedResponse = textContent.text.trim();

  if (cleanedResponse.startsWith('```')) {
    cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/, '');
    cleanedResponse = cleanedResponse.replace(/\n?```\s*$/, '');
    cleanedResponse = cleanedResponse.trim();
  }

  // Parse JSON array
  try {
    const fields: FormField[] = JSON.parse(cleanedResponse);

    console.log(`📋 Identified ${fields.length} fields:`);

    fields.forEach((field) => {
      console.log(`   - ${field.fieldName}: ${field.selector} (${field.fieldType})`);
    });

    return fields;
  } catch (error) {
    console.error('❌ Failed to parse field mappings:', error);
    console.error('Claude response:', cleanedResponse);

    throw new Error('Failed to parse field mappings from vision analysis');
  }
}

/**
 * If Claude returns a brittle / ambiguous selector (e.g. `select` or `select:nth-of-type(2)`),
 * fall back to locating the correct <select> by its nearby <label> text.
 *
 * Returns a Locator so we can call `locator.selectOption()` directly (avoids fragile selectors).
 */
async function resolveSelectLocatorByLabel(
  page: Page,
  fieldName: 'damageType' | 'severity',
  originalSelector: string
): Promise<Locator> {
  // If original selector works AND is unambiguous, keep it.
  try {
    const loc = page.locator(originalSelector);
    const count = await loc.count();
    if (count === 1) return loc.first();
  } catch {
    // ignore and try fallback
  }

  const keywordsByField: Record<'damageType' | 'severity', string[]> = {
    damageType: ['damage', 'issue', 'problem', 'category', 'type'],
    severity: ['severity', 'priority', 'urgency', 'level'],
  };

  const keywords = keywordsByField[fieldName];
  const labelRegex = new RegExp(keywords.map(escapeRegExp).join('|'), 'i');

  const label = page.locator('label').filter({ hasText: labelRegex }).first();
  const labelCount = await label.count();

  if (labelCount === 0) {
    throw new Error(
      `Could not resolve <select> for ${fieldName}. ` +
        `Claude selector failed: ${originalSelector}. ` +
        `Fallback reason: no_label_match`
    );
  }

  const forId = await label.getAttribute('for');

  if (forId) {
    const byId = page.locator(`#${cssEscapeIdentifier(forId)}`);

    if ((await byId.count()) > 0) {
      console.log(
        `   ⚠️  Claude selector failed for ${fieldName} (${originalSelector}); using label->for id: #${forId}`
      );
      return byId.first();
    }
  }

  // Try select inside the label's parent container
  const inParent = label.locator('xpath=..').locator('select').first();
  if ((await inParent.count()) > 0) {
    console.log(
      `   ⚠️  Claude selector failed for ${fieldName} (${originalSelector}); using parent container select`
    );
    return inParent;
  }

  // Try the next select after the label
  const following = label.locator('xpath=following::select[1]').first();
  if ((await following.count()) > 0) {
    console.log(
      `   ⚠️  Claude selector failed for ${fieldName} (${originalSelector}); using following select`
    );
    return following;
  }

  throw new Error(
    `Could not resolve <select> for ${fieldName}. ` +
      `Claude selector failed: ${originalSelector}. ` +
      `Fallback reason: no_select_found_near_label`
  );
}

/**
 * Maps damage type to appropriate dropdown option
 *
 * CHALLENGE: Each form has different dropdown options.
 * - Wake County: "structural", "electrical", "corrosion"
 * - Durham County: "power-infrastructure", "equipment-failure"
 * - Cary City: "pole-damage", "transformer-issue"
 *
 * We need to intelligently match our data to the available options.
 *
 * @param page - Playwright page
 * @param selector - Dropdown selector
 * @param damageType - Our damage type string
 * @returns The option value to select
 */
async function findBestDropdownOption(select: Locator, damageType: string): Promise<string> {
  // Get all available options from the dropdown
  const options: SelectOption[] = await select.locator('option').evaluateAll((optionElements) =>
    optionElements.map((opt: any) => ({ value: opt.value || '', text: opt.text || '' }))
  );

  if (options.length === 0) {
    throw new Error(`No options found in dropdown`);
  }

  // Filter out empty/placeholder options
  const validOptions = options.filter((opt) => opt.value !== '');

  if (validOptions.length === 0) {
    throw new Error(`No valid options found in dropdown`);
  }

  console.log(`   Available options:`, validOptions.map(o => o.text).join(', '));

  /**
   * SIMPLE MATCHING LOGIC
   *
   * In production, you'd use Claude to do semantic matching.
   * For now, we do simple keyword matching:
   * - If damageType contains "structural" → find option with "structural"
   * - If damageType contains "electrical" → find option with "electrical"
   * - etc.
   */
  const damageTypeLower = damageType.toLowerCase();

  // Try to find best match
  for (const option of validOptions) {
    const optionTextLower = option.text.toLowerCase();
    const optionValueLower = option.value.toLowerCase();

    // Check for keyword matches
    if (
      optionTextLower.includes('structural') && damageTypeLower.includes('structural') ||
      optionTextLower.includes('electrical') && damageTypeLower.includes('electrical') ||
      optionTextLower.includes('power') && (damageTypeLower.includes('electrical') || damageTypeLower.includes('power')) ||
      optionTextLower.includes('equipment') && (damageTypeLower.includes('equipment') || damageTypeLower.includes('failure')) ||
      optionTextLower.includes('corrosion') && damageTypeLower.includes('corrosion') ||
      optionTextLower.includes('pole') && damageTypeLower.includes('pole') ||
      optionTextLower.includes('transformer') && damageTypeLower.includes('transformer') ||
      optionValueLower.includes('structural') && damageTypeLower.includes('structural')
    ) {
      console.log(`   ✓ Matched to: "${option.text}"`);
      return option.value;
    }
  }

  // Fallback: use first non-empty option
  console.log(`   ⚠️  No exact match, using first option: "${validOptions[0].text}"`);
 
  return validOptions[0].value;
}

/**
 * Similar logic for severity/priority mapping
 */
async function findBestSeverityOption(
  select: Locator,
  severity: string
): Promise<string> {
  // Get all available options from the dropdown
  const options: SelectOption[] = await select.locator('option').evaluateAll((optionElements) =>
    optionElements.map((opt: any) => ({ value: opt.value || '', text: opt.text || '' }))
  );

  if (options.length === 0) {
    throw new Error(`No options found in severity dropdown`);
  }

  const validOptions = options.filter((opt) => opt.value !== '');
  
  if (validOptions.length === 0) {
    throw new Error(`No valid options found in severity dropdown`);
  }

  console.log(`   Available options:`, validOptions.map(o => o.text).join(', '));

  // Map severity to keywords
  const severityKeywords: { [key: string]: string[] } = {
    high: ['high', 'critical', 'emergency', 'immediate', 'priority 1', 'urgent', '1 -'],
    medium: ['medium', 'moderate', 'standard', 'priority 2', 'priority 3', '2 -', '3 -'],
    low: ['low', 'routine', 'priority 4', '4 -'],
  };

  const keywords = severityKeywords[severity.toLowerCase()] || [];

  for (const keyword of keywords) {
    for (const option of validOptions) {
      if (option.text.toLowerCase().includes(keyword) ||
          option.value.toLowerCase().includes(keyword)) {
        console.log(`   ✓ Matched "${severity}" to: "${option.text}"`);
        return option.value;
      }
    }
  }

  console.log(`   ⚠️  No match for "${severity}", using first option: "${validOptions[0].text}"`);
  
  return validOptions[0].value;
}

/**
 * MAIN FUNCTION: Fill a form with inspection data
 *
 * This orchestrates the entire vision-based filling process.
 *
 * @param formPath - Path to the HTML form
 * @param data - Extracted inspection data to fill
 */
export async function fillFormWithVision(
  formPath: string,
  data: InspectionData
): Promise<void> {
  let browser: Browser | null = null;

  try {
    console.log('\n' + '='.repeat(80));
    console.log(`FILLING FORM: ${path.basename(formPath)}`);
    console.log('='.repeat(80));

    // STEP 1: Open form and take screenshot
    const { screenshot, page, browser: browserInstance } = await openFormAndScreenshot(formPath);
    
    browser = browserInstance;

    // STEP 2: Analyze screenshot with Claude Vision
    const fields = await analyzeFormWithVision(screenshot);

    // STEP 3: Fill each field based on Claude's field mappings
    console.log(`\n📝 Filling form fields...`);

    for (const field of fields) {
      console.log(`\n  Filling ${field.fieldName}...`);

      try {
        if (field.fieldType === 'input') {
          // Fill text input
          const value =
            field.fieldName === 'location'
              ? data.location
              : data[field.fieldName as keyof InspectionData]?.toString() || '';

          await page.fill(field.selector, value);
          console.log(`    ✓ Entered: "${value}"`);

        } else if (field.fieldType === 'select') {
          // Fill dropdown
          if (field.fieldName === 'damageType') {
            const selectToUse = await resolveSelectLocatorByLabel(
              page,
              'damageType',
              field.selector
            );
            const optionValue = await findBestDropdownOption(selectToUse, data.damageType);
           
            await selectToUse.selectOption(optionValue);

          } else if (field.fieldName === 'severity') {
            const selectToUse = await resolveSelectLocatorByLabel(
              page,
              'severity',
              field.selector
            );
            const optionValue = await findBestSeverityOption(selectToUse, data.severity);
            
            await selectToUse.selectOption(optionValue);
          }

        } else if (field.fieldType === 'textarea') {
          // Fill textarea
          await page.fill(field.selector, data.notes);
         
          console.log(`    ✓ Entered notes (${data.notes.length} chars)`);
        }

        // Small delay for visual feedback (optional)
        await page.waitForTimeout(300);

      } catch (error) {
        console.error(`    ❌ Failed to fill ${field.fieldName}:`, error);
      }
    }

    // STEP 4: Submit the form
    console.log(`\n📤 Submitting form...`);
   
    await page.click('button[type="submit"]');

    // Wait a moment to see the success message
    await page.waitForTimeout(2000);

    console.log(`✅ Form submitted successfully!\n`);

    // Keep browser open for a moment so you can see the result
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('\n❌ Error filling form:', error);
   
    throw error;
  } finally {
    // Always close the browser
    if (browser) {
      await browser.close();
    }
  }
}
