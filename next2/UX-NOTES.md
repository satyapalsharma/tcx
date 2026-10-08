# Simplified SaaS UX

The application opens directly to the current workspace overview. The hierarchy is **organization → workspace → jobs**. Organizations share people; workspaces keep jobs and results separate. The organization switcher creates and switches organizations. The workspace switcher and Workspaces page create and switch workspaces.

## Essential forms

| Action | Required input | Optional input |
| --- | --- | --- |
| Create organization | Name | None; creates a General workspace |
| Create workspace | Name | None |
| Invite member | Email | Role defaults to Builder |
| Intent analysis | Transcript file | Job name |
| Intent clustering | Existing intent list | Job name |
| Flow design | Cluster list | Job name |
| Agent build | Flow definition | Job name, runtime defaults to Google ADK |
| Full pipeline | Transcript file | Job name; Google ADK default |

Clustering accepts an intent list directly, so users do not have to extract intents first. Each creation action uses the same New job dialog, preselects the requested type, and takes users to Jobs. Customer Operations additionally offers labeled sample inputs. Other workspaces require their own input.

## Navigation and results

- Overview: two primary actions (analyze conversations or cluster existing intents), optional next stages, and recent jobs.
- Jobs: search, one status filter, and a concise input/status details dialog.
- Workspaces: only workspaces within the selected organization.
- Intents & clusters, Flows, Agents: focused results views with actionable empty states.
- Members: email invitations, roles, and confirmation before removal.
- Settings: organization name and links to members, workspaces, integrations and audit history.

Model tuning, deployment switches, review-gate bypasses, duplicate creation forms, synthetic processing panels, and the screen catalogue are removed from the main flow. SVG icons do not shrink or clip their strokes. Muted backgrounds and muted text use separate color values.

## Prototype boundary

This project has no processing, authentication or email backend. Organization/workspace/job/member changes persist in this browser's local storage. File contents remain on the device; job records store the selected filename and input/runtime metadata. Invitations are local demo records, not sent emails. Skyline sample integrations/history and Customer Operations sample results are explicitly labeled and are not shown under newly created organizations/workspaces. These client-side scopes are UX behavior, not server-enforced authorization.

Verified with TypeScript, changed-file ESLint, production build and browser checks covering org/workspace creation, direct clustering, missing-input validation, persistence, invite deduplication, and phone-width layout.

Browser verification left an isolated **UX Sandbox** organization with General/Support workspaces and an `ux-review@example.com` demo invitation in the local preview. A sample clustering job was added in Customer Operations. The preview was returned to Skyline Communications afterward. No email or file contents were sent.
