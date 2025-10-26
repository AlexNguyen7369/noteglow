import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { InferenceClient } from '@huggingface/inference';

// Zod schema for request validation
const TransformOptionsSchema = z.object({
  autoFormat: z.boolean(),
  highlightKeyTerms: z.boolean(),
  comments: z.boolean(),
});

const TransformRequestSchema = z.object({
  notes: z.string().min(1, 'Notes cannot be empty'),
  options: TransformOptionsSchema,
});

// TypeScript types
export type TransformOptions = z.infer<typeof TransformOptionsSchema>;
export type TransformRequest = z.infer<typeof TransformRequestSchema>;

export type TransformResult = {
  formattedNotes: string;
  highlights: string[];
  comments: string[];
};

export async function POST(request: NextRequest) {
  try {
    // Check if HF_TOKEN is set
    if (!process.env.HF_TOKEN) {
      return NextResponse.json(
        { error: 'HF_TOKEN environment variable is not set. Please configure your HuggingFace API token in .env.local' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request with Zod
    const validatedData = TransformRequestSchema.parse(body);
    const { notes, options } = validatedData;

    // Initialize HuggingFace client
    const client = new InferenceClient(process.env.HF_TOKEN);

    // Build dynamic system prompt based on selected options
    let systemPrompt = `You are a careful study notes formatter that never invents facts. You analyze and transform student notes based on specific criteria.

STRICT RULES:
- Only apply transformations that are explicitly requested
- Never add information not in the original notes
- Never invent facts or details
- Format output as valid JSON`;

    // Build transformation instructions
    const instructions: string[] = [];

    if (options.autoFormat) {
      instructions.push(`
- Auto-Format: Apply markdown formatting including:
  - Use headers (##, ###) for main topics and subtopics
  - Convert lists to bullet points or numbered lists where appropriate
  - Add emphasis (**bold**, *italic*) to important terms
  - Organize content logically with clear sections`);
    } else {
      instructions.push(`- Do NOT apply any formatting changes to the original notes`);
    }

    if (options.highlightKeyTerms) {
      instructions.push(`
- Highlight Key Terms: Extract the most important terms and concepts
  - Return as a JSON array of key terms
  - Include 5-10 most significant terms
  - Format: "highlights": ["term1", "term2", ...]`);
    } else {
      instructions.push(`- Do NOT extract or highlight any key terms`);
    }

    if (options.comments) {
      instructions.push(`
- Comments/Insight: Generate helpful learning insights
  - Provide brief explanations of complex concepts
  - Add memory tips or mnemonics where helpful
  - Suggest connections between related ideas
  - Return as a JSON array of comments
  - Format: "comments": ["insight1", "insight2", ...]`);
    } else {
      instructions.push(`- Do NOT generate any comments or insights`);
    }

    systemPrompt += `

TRANSFORMATION CRITERIA:
${instructions.join('\n')}

OUTPUT FORMAT (valid JSON):
{
  "formattedNotes": "the transformed notes (with formatting if requested, plain if not)",
  "highlights": ${options.highlightKeyTerms ? '["key", "terms", "here"]' : '[]'},
  "comments": ${options.comments ? '["comment1", "comment2"]' : '[]'}
}`;

    // Call HuggingFace Inference API
    // Note: Using meta-llama/Llama-2-70b-chat-hf as it's more reliable
    // You can change to 'deepseek-ai/DeepSeek-V3-0324' if you prefer
    let response;
    try {
      response = await client.chatCompletion({
        model: 'meta-llama/Llama-2-70b-chat-hf',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Please transform these notes according to the criteria specified:\n\n${notes}`,
          },
        ],
        temperature: 0.5, // Lower temperature for more consistent output
        max_tokens: 4096,
      });
    } catch (apiError) {
      console.error('HuggingFace API Error:', apiError);
      if (apiError instanceof Error) {
        if (apiError.message.includes('401') || apiError.message.includes('Unauthorized')) {
          return NextResponse.json(
            { error: 'HuggingFace API authentication failed. Check your HF_TOKEN is valid.' },
            { status: 401 }
          );
        }
        if (apiError.message.includes('429') || apiError.message.includes('rate')) {
          return NextResponse.json(
            { error: 'HuggingFace API rate limit exceeded. Please try again in a moment.' },
            { status: 429 }
          );
        }
        if (apiError.message.includes('overloaded')) {
          return NextResponse.json(
            { error: 'HuggingFace model is currently overloaded. Please try again later.' },
            { status: 503 }
          );
        }
        return NextResponse.json(
          { error: `HuggingFace API Error: ${apiError.message}` },
          { status: 500 }
        );
      }
      throw apiError;
    }

    // Extract the response content
    const responseContent =
      response.choices[0]?.message.content;

    if (!responseContent) {
      return NextResponse.json(
        { error: 'No response content received from HuggingFace API' },
        { status: 500 }
      );
    }

    // Check if response contains an error message (e.g., "Internal Server Error")
    if (
      responseContent.toLowerCase().includes('error') ||
      responseContent.toLowerCase().includes('internal') ||
      responseContent.toLowerCase().includes('overloaded')
    ) {
      console.error('HuggingFace Error Response:', responseContent);
      return NextResponse.json(
        {
          error: 'HuggingFace API returned an error. This may be due to: 1) API overload, 2) Invalid token, or 3) Model unavailable. Please try again in a few moments.',
          details: responseContent.substring(0, 200),
        },
        { status: 503 }
      );
    }

    // Parse the JSON response - handle markdown code blocks and extra text
    let transformResult: TransformResult;
    try {
      let jsonContent = responseContent;

      // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
      const jsonBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        jsonContent = jsonBlockMatch[1];
      }

      // Try to find JSON object in the response
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      const parsedResponse = JSON.parse(jsonContent);
      transformResult = {
        formattedNotes: parsedResponse.formattedNotes || '',
        highlights: Array.isArray(parsedResponse.highlights)
          ? parsedResponse.highlights
          : [],
        comments: Array.isArray(parsedResponse.comments)
          ? parsedResponse.comments
          : [],
      };
    } catch (parseError) {
      // If JSON parsing fails, log the actual response for debugging
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', responseContent);
      return NextResponse.json(
        {
          error: 'Failed to parse transformation response. The model may have returned invalid JSON. Please try again.',
          details: responseContent.substring(0, 200),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(transformResult, { status: 200 });
  } catch (error) {
    // Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // HuggingFace API errors
    if (error instanceof Error) {
      if (error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Authentication failed. Check HF_TOKEN environment variable.' },
          { status: 401 }
        );
      }
      if (error.message.includes('rate')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: 'Transformation failed', details: error.message },
        { status: 500 }
      );
    }

    // Generic error
    return NextResponse.json(
      { error: 'An unexpected error occurred during transformation' },
      { status: 500 }
    );
  }
}
