/**
 * Streaming-aware self-healing helpers for BPMN XML.
 *
 * While an LLM streams a BPMN diagram token by token, the document is not yet
 * well-formed XML: elements may still be open, attributes may be half-written,
 * and diagram-interchange shapes may be incomplete. `mendBpmn` closes every
 * complete, still-open element so the partial document can be imported by
 * `bpmn-js`.
 */

const NAME_PART = "[A-Za-z_][\\w.-]*(?::[\\w.-]+)?";

const BPMN_DIAGRAM_REGEX = new RegExp(
  `<(?:[A-Za-z_][\\w.-]*:)?BPMNDiagram\\b`,
);
const BPMN_PLANE_REGEX = new RegExp(`<(?:[A-Za-z_][\\w.-]*:)?BPMNPlane\\b`);
const BPMN_SHAPE_REGEX = new RegExp(`<(?:[A-Za-z_][\\w.-]*:)?BPMNShape\\b`);
const BPMN_BOUNDS_REGEX = new RegExp(
  `<(?:[A-Za-z_][\\w.-]*:)?Bounds\\b(?=[^>]*\\bx=)(?=[^>]*\\by=)(?=[^>]*\\bwidth=)(?=[^>]*\\bheight=)[^>]*>`,
);

const BPMN_COMPLETE_REGEX = new RegExp(
  `</(?:[A-Za-z_][\\w.-]*:)?definitions>\\s*$`,
);

const TAG_NAME_REGEX = new RegExp(`^/?\\s*(${NAME_PART})`);

/** True once the diagram-interchange section has started streaming. */
export const hasBpmnDiagram = (code: string): boolean =>
  BPMN_DIAGRAM_REGEX.test(code);

/**
 * True once the diagram-interchange section contains enough complete layout
 * data for bpmn-js to attempt its first render.
 */
export const hasRenderableBpmnDiagram = (code: string): boolean =>
  BPMN_DIAGRAM_REGEX.test(code) &&
  BPMN_PLANE_REGEX.test(code) &&
  BPMN_SHAPE_REGEX.test(code) &&
  BPMN_BOUNDS_REGEX.test(code);

/** True when the closing definitions tag has arrived. */
export const isBpmnComplete = (code: string): boolean =>
  BPMN_COMPLETE_REGEX.test(code.trim());

const extractTagName = (rawTag: string): string => {
  const match = TAG_NAME_REGEX.exec(rawTag);

  return match ? match[1] : "";
};

/**
 * Finds the `>` that closes a tag while ignoring `>` inside quoted attributes.
 * Returns `-1` when the tag is still incomplete.
 */
const findTagEnd = (code: string, start: number): number => {
  let quote = "";

  for (let i = start; i < code.length; i += 1) {
    const char = code[i];

    if (quote) {
      if (char === quote) {
        quote = "";
      }

      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ">") {
      return i;
    }
  }

  return -1;
};

/**
 * Makes a possibly truncated BPMN document well-formed enough for an
 * incremental render.
 *
 * - Complete documents are returned unchanged.
 * - A trailing half-written tag is dropped.
 * - Complete processing instructions, comments, and declarations are kept.
 * - Truncated processing instructions, comments, and declarations are dropped.
 * - Remaining open elements are closed in innermost-first order.
 */
export const mendBpmn = (input: string): string => {
  const stack: string[] = [];
  let cursor = 0;
  let safeEnd = 0;

  while (cursor < input.length) {
    const lt = input.indexOf("<", cursor);

    if (lt === -1) {
      safeEnd = input.length;
      break;
    }

    const next = input[lt + 1];

    if (next === "?") {
      const end = input.indexOf("?>", lt + 2);

      if (end === -1) {
        safeEnd = lt;
        break;
      }

      cursor = end + 2;
      safeEnd = cursor;
      continue;
    }

    if (next === "!") {
      if (input.startsWith("<!--", lt)) {
        const end = input.indexOf("-->", lt + 4);

        if (end === -1) {
          safeEnd = lt;
          break;
        }

        cursor = end + 3;
        safeEnd = cursor;
        continue;
      }

      const end = input.indexOf(">", lt + 2);

      if (end === -1) {
        safeEnd = lt;
        break;
      }

      cursor = end + 1;
      safeEnd = cursor;
      continue;
    }

    const tagEnd = findTagEnd(input, lt + 1);

    if (tagEnd === -1) {
      safeEnd = lt;
      break;
    }

    const rawTag = input.slice(lt + 1, tagEnd);
    const isClosing = rawTag.startsWith("/");
    const isSelfClosing = rawTag.endsWith("/");
    const name = extractTagName(rawTag);

    if (isClosing) {
      for (let depth = stack.length - 1; depth >= 0; depth -= 1) {
        if (stack[depth] === name) {
          stack.length = depth;
          break;
        }
      }
    } else if (!isSelfClosing && name) {
      stack.push(name);
    }

    cursor = tagEnd + 1;
    safeEnd = cursor;
  }

  let result = input.slice(0, safeEnd);

  for (let depth = stack.length - 1; depth >= 0; depth -= 1) {
    result += `</${stack[depth]}>`;
  }

  return result;
};
