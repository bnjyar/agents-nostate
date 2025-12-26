import React, { useState, useEffect, type ReactNode } from "react";
import { Box, Text } from "ink";
import type { TUIAgentUIToolPart } from "../types";
import { getToolName } from "ai";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function ToolSpinner() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return <Text color="yellow">{SPINNER_FRAMES[frame]} </Text>;
}

function ToolLayout({
  name,
  summary,
  output,
  error,
  running,
}: {
  name: string;
  summary: string;
  output?: ReactNode;
  error?: string;
  running: boolean;
}) {
  const dotColor = running ? "yellow" : error ? "red" : "green";

  return (
    <Box flexDirection="column" marginTop={1} marginBottom={1}>
      <Box>
        {running ? <ToolSpinner /> : <Text color={dotColor}>● </Text>}
        <Text bold color={running ? "yellow" : "white"}>
          {name}
        </Text>
        <Text color="gray">(</Text>
        <Text color="cyan">{summary}</Text>
        <Text color="gray">)</Text>
      </Box>

      {output && (
        <Box paddingLeft={2}>
          <Text color="gray">└ </Text>
          {output}
        </Box>
      )}

      {error && (
        <Box paddingLeft={2}>
          <Text color="gray">└ </Text>
          <Text color="red">Error: {error.slice(0, 80)}</Text>
        </Box>
      )}
    </Box>
  );
}

export function ToolCall({ part }: { part: TUIAgentUIToolPart }) {
  const running =
    part.state === "input-streaming" || part.state === "input-available";
  const error = part.state === "output-error" ? part.errorText : undefined;

  switch (part.type) {
    case "tool-read": {
      const filePath = part.input?.filePath ?? "...";
      const lines =
        part.state === "output-available" ? part.output?.totalLines : undefined;
      return (
        <ToolLayout
          name="Read"
          summary={lines ? `${filePath} (${lines} lines)` : filePath}
          output={lines && <Text color="white">Read {lines} lines</Text>}
          error={error}
          running={running}
        />
      );
    }

    case "tool-write": {
      const filePath = part.input?.filePath ?? "...";
      return (
        <ToolLayout
          name="Write"
          summary={filePath}
          output={
            part.state === "output-available" && (
              <Text color="white">File written</Text>
            )
          }
          error={error}
          running={running}
        />
      );
    }

    case "tool-edit": {
      const filePath = part.input?.filePath ?? "...";
      return (
        <ToolLayout
          name="Edit"
          summary={filePath}
          output={
            part.state === "output-available" && (
              <Text color="white">File updated</Text>
            )
          }
          error={error}
          running={running}
        />
      );
    }

    case "tool-glob": {
      const pattern = part.input?.pattern ?? "...";
      const files =
        part.state === "output-available" ? part.output?.files : undefined;
      return (
        <ToolLayout
          name="Glob"
          summary={`"${pattern}"`}
          output={
            files && <Text color="white">Found {files.length} files</Text>
          }
          error={error}
          running={running}
        />
      );
    }

    case "tool-grep": {
      const pattern = part.input?.pattern ?? "...";
      const matches =
        part.state === "output-available" ? part.output?.matches : undefined;
      return (
        <ToolLayout
          name="Grep"
          summary={`"${pattern}"`}
          output={
            matches && <Text color="white">Found {matches.length} matches</Text>
          }
          error={error}
          running={running}
        />
      );
    }

    case "tool-bash": {
      const cmd = String(part.input?.command ?? "").slice(0, 50);
      const summary = cmd + (cmd.length >= 50 ? "..." : "");
      const exitCode =
        part.state === "output-available" ? part.output?.exitCode : undefined;
      return (
        <ToolLayout
          name="Bash"
          summary={summary || "..."}
          output={
            exitCode !== undefined && (
              <Text color="white">
                {exitCode === 0 ? "Command succeeded" : `Exit code ${exitCode}`}
              </Text>
            )
          }
          error={error}
          running={running}
        />
      );
    }

    case "tool-todo_write": {
      return (
        <ToolLayout
          name="TodoWrite"
          summary="Updating tasks"
          output={
            part.state === "output-available" && (
              <Text color="white">Tasks updated</Text>
            )
          }
          error={error}
          running={running}
        />
      );
    }

    case "tool-task": {
      const desc = part.input?.task ?? "Spawning subagent";
      return (
        <ToolLayout
          name="Task"
          summary={desc}
          output={
            part.state === "output-available" && (
              <Text color="white">Complete</Text>
            )
          }
          error={error}
          running={running}
        />
      );
    }

    default: {
      const toolName = getToolName(part);

      const name = toolName.charAt(0).toUpperCase() + toolName.slice(1);
      return (
        <ToolLayout
          name={name}
          summary={JSON.stringify(part.input).slice(0, 40)}
          output={
            part.state === "output-available" && <Text color="white">Done</Text>
          }
          error={error}
          running={running}
        />
      );
    }
  }
}
