import { RechartsChartSpecSchema } from "./schema";
import type { ParseResult } from "./schema";

export const parseChartSpec = (code: string, isIncomplete?: boolean): ParseResult => {
  if (isIncomplete) {
    return { status: "loading" };
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(code);
  } catch {
    // The fence may report complete before the JSON is fully streamed in.
    // Truncated JSON throws here, so keep showing the loading state rather
    // than flashing an error mid-stream.
    return { status: "loading" };
  }

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
};
