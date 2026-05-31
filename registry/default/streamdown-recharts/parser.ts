import { RechartsChartSpecSchema } from "./schema";
import type { ParseResult } from "./schema";

const isLikelyIncompleteJson = (code: string): boolean => {
  const trimmedCode = code.trim();

  return trimmedCode === "" || !/[}\]]$/.test(trimmedCode);
};

export const parseChartSpec = (code: string, isIncomplete?: boolean): ParseResult => {
  if (isIncomplete) {
    return { status: "loading" };
  }

  try {
    const parsedJson: unknown = JSON.parse(code);
    const parseResult = RechartsChartSpecSchema.safeParse(parsedJson);

    if (!parseResult.success) {
      return {
        status: "invalid",
        message:
          parseResult.error.issues[0]?.message ??
          "Invalid Recharts JSON structure.",
      };
    }

    return { status: "valid", spec: parseResult.data };
  } catch {
    if (isLikelyIncompleteJson(code)) {
      return { status: "loading" };
    }

    return {
      status: "invalid",
      message: "Could not parse the Recharts JSON.",
    };
  }
};
