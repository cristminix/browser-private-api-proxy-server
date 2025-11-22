[Current User Query]
[ERROR] You did not use a tool in your previous response! Please retry with a tool use.

# Reminder: Instructions for Tool Use

Tool uses are formatted using XML-style tags. The tool name itself becomes the XML tag name. Each parameter is enclosed within its own set of tags. Here's the structure:

<actual_tool_name>
<parameter1_name>value1</parameter1_name>
<parameter2_name>value2</parameter2_name>
...
</actual_tool_name>

For example, to use the attempt_completion tool:

<attempt_completion>
<result>
I have completed the task...
</result>
</attempt_completion>

Always use the actual tool name as the XML tag name for proper parsing and execution.

# Next Steps

If you have completed the user's task, use the attempt_completion tool.
If you require additional information from the user, use the ask_followup_question tool.
Otherwise, if you have not completed the task and do not need additional information, then proceed with the next step of the task.
(This is an automated message, so do not respond to it conversationally.)
<environment_details>
# VSCode Visible Files
src\scene.tsx

# VSCode Open Tabs
tsconfig.json,package.json,src/project.ts,revideo.config.ts,src/scene.tsx

# Current Time
Current time in ISO 8601 UTC format: 2025-10-24T21:54:09.942Z
User time zone: Asia/Bangkok, UTC+7:00

# Current Cost
$0.00

# Current Mode
<slug>ask</slug>
<name>Ask</name>
<model>kimi-k2</model>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>
