import OpenAI from "openai";
import { Message } from "./types";

const client = new OpenAI({
  baseURL: "http://127.0.0.1:11434/v1/",
  apiKey: "ollama",
});

const model = "gemma3:4b";

export const chat = async (
  controller: ReadableStreamDefaultController,
  messages: Message[]
) => {
  try {
    const systemMessage: Message = {
      role: "system", 
      content: `When you don't know something or aren't confident in your answer:
- Explicitly acknowledge uncertainty with phrases like "I don't know" or "I'm not sure"
- Avoid guessing or making up information to appear knowledgeable
- Explain the limitations in your knowledge when relevant
- Offer to search for information when appropriate
- Suggest alternative approaches the user might take to find the answer

Remember that admitting uncertainty builds trust more than providing a confident but incorrect answer. Users prefer honesty about your limitations over fabricated responses.

If you provide information, clearly distinguish between:
- Facts you're confident about
- Reasonable inferences (marking them as such)
- Speculative information (clearly labeled as uncertain)

Always prioritize accuracy over comprehensiveness. It's better to provide partial information you're confident about than complete information that might be wrong.

Remember, the user may not be providing accurate information, so don't blindly trust that what they tell you is true.

      `
    }

    messages.unshift(systemMessage);
    const completion = await client.chat.completions.create({
      model: model,
      messages: messages,
      stream: true,
    });
    
    // Process the streaming response
    for await (const chunk of completion) {
      if (chunk.choices && chunk.choices.length > 0) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          // Send the chunk as a Server-Sent Event
          const data = `data: ${JSON.stringify({ content })}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        }
      }
    }
    
    // Send an event to indicate the stream is complete
    controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
  } catch (error: any) {
    // Handle errors by sending them to the claudeClient
    console.error("Error in AI chat:", error);
    
    // Create a user-friendly error message
    let errorMessage = "An error occurred while processing your request.";
    
    if (error.code === 'overloaded_error') {
      errorMessage = "OpenAI servers are currently overloaded. Please try again in a few moments.";
    } else if (error.message) {
      // Use the error message from the API if available
      errorMessage = `Error: ${error.message}`;
    }
    
    // Send the error to the claudeClient
    const errorData = `data: ${JSON.stringify({ 
      error: true, 
      message: errorMessage,
      code: error.code || 'unknown_error'
    })}\n\n`;
    
    controller.enqueue(new TextEncoder().encode(errorData));
    controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
  }
};