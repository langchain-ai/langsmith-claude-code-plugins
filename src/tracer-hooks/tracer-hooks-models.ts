export interface TracerHookInput {
  session_id: string;
  cwd: string;
  hook_event_name?: string;
  transcript_path?: string;
  agent_id?: string;
  tool_use_id?: string;
  permission_mode?: string;
  last_assistant_message?: string;
  error?: string;
  error_details?: string;
}
