/**
 * CLAUDE CLIENT UTILITY
 *
 * This module sets up the Anthropic SDK client.
 * Centralizing the client creation ensures consistent configuration.
 */

import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
 
dotenv.config();

const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  throw new Error(
    'ANTHROPIC_API_KEY not found in environment variables. ' +
    'Create a .env file with: ANTHROPIC_API_KEY=your_key_here'
  );
}

//Initialize the Anthropic client
export const anthropic = new Anthropic({
  apiKey: API_KEY,
});


// claude-4-5-sonnet: Best for complex reasoning, coding, analysis
export const MODEL = 'claude-sonnet-4-5-20250929';

/**
 * Helper function to make a Claude API call
 *
 * This wraps the SDK call with error handling and logging.
 * TODO: add retry logic, rate limiting, etc.
 */
export async function callClaude(
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 1024
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt, // System prompt defines Claude's role/behavior
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text from the response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    return textContent.text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}
