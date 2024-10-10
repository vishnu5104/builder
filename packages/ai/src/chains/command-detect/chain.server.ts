import type { Model as BaseModel, ModelMessage, Chain } from "../../types";
import { formatPrompt } from "../../utils/format-prompt";
import { prompt as promptSystemTemplate } from "./__generated__/command-detect.system.prompt";
import { prompt as promptUserTemplate } from "./__generated__/command-detect.user.prompt";
import { createErrorResponse } from "../../utils/create-error-response";
import { type AiContext, AiResponse, name } from "./schema";

/**
 * Command Detect Chain
 *
 * Given a prompt and a list of possible commands and descriptions, it returns an array of operations matching the prompt request.
 */

export { name };

export const createChain = <ModelMessageFormat>(): Chain<
  BaseModel<ModelMessageFormat>,
  AiContext,
  AiResponse
> =>
  async function chain({ model, context }) {
    const { prompt, commands } = context;

    const llmMessages: ModelMessage[] = [
      [
        "system",
        formatPrompt(
          {
            commands: JSON.stringify(commands),
          },
          promptSystemTemplate
        ),
      ],
      ["user", formatPrompt({ prompt }, promptUserTemplate)],
    ];

    const messages = model.generateMessages(llmMessages);

    const completion = await model.completion({
      id: name,
      messages,
    });

    if (completion.success === false) {
      return {
        ...completion,
        llmMessages,
      };
    }

    const completionText = completion.data.choices[0];
    llmMessages.push(["assistant", completionText]);

    let detectedCommands = [];
    try {
      detectedCommands = AiResponse.parse(JSON.parse(completionText));
      const expectedCommands = new Set(Object.keys(commands));
      for (const command of detectedCommands) {
        if (expectedCommands.has(command) === false) {
          throw new Error("Invalid command name detected " + command);
        }
      }
    } catch (error) {
      return {
        id: name,
        ...createErrorResponse({
          status: 500,
          error: `ai.${name}.parseError`,
          message:
            error instanceof Error
              ? error.message
              : "Failed to parse the completion",
          debug: (
            "Failed to parse the completion " +
            (error instanceof Error ? error.message : "")
          ).trim(),
        }),
        llmMessages,
      };
    }

    console.info(JSON.stringify({ prompt, detectedCommands }));

    return {
      ...completion,
      data: detectedCommands,
      llmMessages,
    };
  };
