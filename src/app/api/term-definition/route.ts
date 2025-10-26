import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { InferenceClient } from '@huggingface/inference';

// Zod schema for request validation
const TermDefinitionSchema = z.object({
  term: z.string().min(1, 'Term cannot be empty'),
  context: z.string().optional().default(''), // Optional context from the notes
});

export type TermDefinitionRequest = z.infer<typeof TermDefinitionSchema>;

export type TermDefinitionResult = {
  term: string;
  definition: string;
};

export async function POST(request: NextRequest) {
  try {
    // Check if HF_TOKEN is set
    if (!process.env.HF_TOKEN) {
      return NextResponse.json(
        {
          error:
            'HF_TOKEN environment variable is not set. Please configure your HuggingFace API token in .env.local',
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request with Zod
    const validatedData = TermDefinitionSchema.parse(body);
    const { term, context } = validatedData;

    // Initialize HuggingFace client
    const client = new InferenceClient(process.env.HF_TOKEN);

    // Build prompt for term definition
    const systemPrompt = `You are a helpful tutor that provides clear, concise definitions of academic terms.
Your definitions should be:
- Accurate and based on the context provided
- Concise (1-3 sentences maximum)
- Easy to understand for students
- Free of unnecessary jargon
Return ONLY the definition, nothing else.`;

    const userMessage = context
      ? `Define the term "${term}" in the context of: ${context}`
      : `Provide a clear, academic definition of the term: "${term}"`;

    // Call HuggingFace Inference API
    let response;
    try {
      response = await client.chatCompletion({
        model: 'deepseek-ai/DeepSeek-V3-0324',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent definitions
        max_tokens: 300,
      });
    } catch (apiError) {
      console.error('HuggingFace API Error:', apiError);
      if (apiError instanceof Error) {
        if (
          apiError.message.includes('401') ||
          apiError.message.includes('Unauthorized')
        ) {
          return NextResponse.json(
            {
              error:
                'HuggingFace API authentication failed. Check your HF_TOKEN is valid.',
            },
            { status: 401 }
          );
        }
        if (
          apiError.message.includes('429') ||
          apiError.message.includes('rate')
        ) {
          return NextResponse.json(
            {
              error:
                'HuggingFace API rate limit exceeded. Please try again in a moment.',
            },
            { status: 429 }
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
    const definition = response.choices[0]?.message.content;

    if (!definition) {
      return NextResponse.json(
        { error: 'No definition received from HuggingFace API' },
        { status: 500 }
      );
    }

    const result: TermDefinitionResult = {
      term,
      definition: definition.trim(),
    };

    return NextResponse.json(result, { status: 200 });
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

    // Generic error
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching the term definition' },
      { status: 500 }
    );
  }
}
