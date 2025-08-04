import { type CoreMessage, streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export async function POST(req: Request) {
  const { messages }: { messages: CoreMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: "You are a helpful assistant.",
    messages,
    maxSteps: 10,
    tools: {
      getWeather: tool({
        description: "Get the weather in a given location",
        parameters: z.object({
          location: z.string(),
        }),
        execute: async ({ location }) => {
          return `The weather in ${location} is sunny.`;
        },
      }),
      callMyNumber: tool({
        description: "Call my number",
        parameters: z.object({
          number: z.string(),
        })
      }),
    },
  });

  return result.toDataStreamResponse();
}
