import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const deepSeekResponse = z.object({
  choices: z.array(
    z.object({
      message: z.object({ content: z.string() }),
    }),
  ),
});

export type AssistantContext = {
  id: string;
  title: string;
  address: string;
  status: string;
  priority: string;
  waitingOn: string;
  nextAction: string;
};

export const askDeepSeek = createServerFn({ method: "POST" })
  .validator(
    z.object({
      question: z.string().trim().min(1).max(2000),
      requests: z
        .array(
          z.object({
            id: z.string(),
            title: z.string(),
            address: z.string(),
            status: z.string(),
            priority: z.string(),
            waitingOn: z.string(),
            nextAction: z.string(),
          }),
        )
        .max(100),
    }),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        code: "NOT_CONFIGURED" as const,
        message: "DeepSeek is not configured for this environment.",
      };
    }

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You are Banjg AI, an assistant for Australian property managers. Answer concisely using only the supplied workspace data. Never claim an action was sent or completed. Recommend next actions and include request IDs when relevant.",
          },
          {
            role: "user",
            content: `${data.question}\n\nWorkspace requests:\n${JSON.stringify(data.requests)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const requestId = response.headers.get("x-request-id");
      console.error("DeepSeek request failed", response.status, requestId);
      return {
        ok: false as const,
        code: "UPSTREAM_ERROR" as const,
        message: "DeepSeek could not answer right now. Please try again.",
      };
    }

    const parsed = deepSeekResponse.safeParse(await response.json());
    const answer = parsed.success ? parsed.data.choices[0]?.message.content.trim() : "";
    if (!answer) {
      return {
        ok: false as const,
        code: "INVALID_RESPONSE" as const,
        message: "DeepSeek returned an empty response. Please try again.",
      };
    }

    return { ok: true as const, answer };
  });
