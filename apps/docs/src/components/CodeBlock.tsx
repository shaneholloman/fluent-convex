import { useMemo } from "react";
import { highlight } from "sugar-high";

/**
 * Extract lines between `// #region <name>` and `// #endregion` markers.
 * If no region is specified, the full source is returned (minus any
 * region markers and leading file-level doc comments).
 */
function extractRegion(source: string, region?: string): string {
  if (!region) return source;

  const lines = source.split("\n");
  const startMarker = `// #region ${region}`;
  let capturing = false;
  const captured: string[] = [];

  for (const line of lines) {
    if (line.trim() === startMarker) {
      capturing = true;
      continue;
    }
    if (capturing && line.trim() === "// #endregion") {
      break;
    }
    if (capturing) {
      captured.push(line);
    }
  }

  return captured.length > 0 ? dedent(captured.join("\n")) : source;
}

/** Remove common leading whitespace from a block of code. */
function dedent(code: string): string {
  const lines = code.split("\n");
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length === 0) return code;
  const minIndent = Math.min(
    ...nonEmpty.map((l) => l.match(/^(\s*)/)?.[1].length ?? 0)
  );
  return lines.map((l) => l.slice(minIndent)).join("\n").trim();
}

export function CodeBlock({
  source,
  region,
  title,
}: {
  source: string;
  region?: string;
  title?: string;
}) {
  const html = useMemo(() => {
    const code = extractRegion(source, region);
    return highlight(code);
  }, [source, region]);

  return (
    <div className="rounded-lg overflow-hidden">
      {title && (
        <div className="bg-slate-700 text-slate-300 text-xs px-4 py-2 font-mono">
          {title}
        </div>
      )}
      <pre className="bg-slate-800 text-slate-100 p-4 overflow-x-auto text-sm leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
