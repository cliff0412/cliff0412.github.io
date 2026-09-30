---
title: a deep dive into codex
date: 2026-09-30 10:40:00
tags: [agent, codex, ai]
---

Codex looks like a chat interface, but the model is only one component. The useful system is a loop around the model: collect context, ask the model what to do, execute tools, return their results, enforce permissions, persist the history, and repeat until the task is complete.

That distinction explains why an agent can work across a repository while a plain language model can only propose text. Codex can observe the real result of a command or edit and use that feedback in its next decision.

This article develops a source-level mental model of the open-source Codex runtime. Names and file paths reflect a snapshot of the implementation and may move; the architectural boundaries are the durable part. For the current public protocol and behavior, use the [Codex app-server documentation](https://learn.chatgpt.com/docs/app-server) as the source of truth.

## 1. The big picture

The runtime can be understood as five layers:

```text
┌──────────────────────────────────────────────────────────────┐
│ Frontends                                                    │
│ TUI · exec · CLI · IDE extension · VS Code · Codex Web      │
└──────────────────────────────┬───────────────────────────────┘
                               │ app-server protocol
                               │ thread/* · turn/* · item/*
┌──────────────────────────────▼───────────────────────────────┐
│ App server                                                   │
│ Translates client requests and streams events                │
│ In-process for some clients; stdio/WebSocket for others      │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Core engine                                                  │
│ Session/thread → task → model/tool loop                      │
│                                                              │
│ model client ────────────────► Responses API                 │
│ tool orchestrator ───────────► shell · apply_patch · MCP     │
│ rollout recorder ────────────► persistent history            │
└──────────────────┬─────────────────────────┬─────────────────┘
                   │                         │
        ┌──────────▼──────────┐   ┌──────────▼──────────┐
        │ Approval policy     │   │ OS sandbox          │
        │ user / rules /      │   │ filesystem, process │
        │ automated reviewer  │   │ and network limits  │
        └─────────────────────┘   └─────────────────────┘
```

The frontends do not each implement their own coding agent. They present different views over the same underlying engine. The app server provides the integration boundary: authentication, conversation history, approvals, streamed events, and thread/turn operations. This separation lets the TUI and an IDE extension behave differently without duplicating the agent loop.

The core engine owns the work. It prepares model input, receives a streamed response, dispatches requested tools, feeds observations back to the model, and records what happened. Approval routing decides whether an action may proceed; the sandbox limits what a permitted command can actually touch.

This is the most important high-level split:

- the **model** proposes actions;
- the **harness** coordinates the loop;
- the **tools** interact with the world;
- the **policy layer** decides when human authorization is required;
- the **sandbox** enforces the technical boundary;
- the **rollout** makes the work resumable and inspectable.

The same pattern appears in OpenAI's managed agent architecture: a harness runs the model/tool loop, while a separate environment provides files and compute. The local Codex runtime places that idea on the developer's machine.

## 2. The core mental model: queues, sessions, tasks, and turns

At the source level, Codex behaves like a headless asynchronous service. A user interface communicates with it through two logical streams:

- **Submission queue (SQ), UI → Codex.** User input and control messages enter the engine: start work, interrupt, answer a question, or resolve an approval.
- **Event queue (EQ), Codex → UI.** Progress returns to the client: text deltas, item updates, approval requests, errors, and completion events.

This is why the engine is reusable. The transport can be an in-process channel, standard input/output, or a socket; the core still sees requests arriving in one direction and events leaving in the other. The current app-server protocol exposes this model as JSON-RPC requests plus `thread/*`, `turn/*`, and `item/*` notifications.

The state hierarchy in the photographed source notes is:

| Concept | Meaning | Typical source area |
| --- | --- | --- |
| Session | Configuration and state for one conversation; normally one active unit of work at a time | `core/src/session/` |
| Task | Work initiated by one user request; it can require several model/tool iterations | `core/src/tasks/` |
| Turn | One pass through prompt construction, model streaming, and tool-result handling | `core/src/session/turn.rs` |

There is a terminology trap here. In the public app-server API, a **thread** is the persistent conversation and a **turn** is the user-visible cycle started by `turn/start`. Internal names can be finer-grained and can change over time. When integrating with Codex, follow the public protocol; when reading the source, first identify what that version means by session, task, and turn.

## 3. The agent loop

The turn loop is the heart of Codex. Conceptually, each iteration does five things.

### 3.1 Build the prompt

Codex assembles the material the model needs: system and developer instructions, repository guidance such as `AGENTS.md`, conversation history, the current request, available tool definitions, relevant environment state, and any tool results from the previous iteration.

The prompt is therefore not just the latest chat message. It is a structured snapshot of the task and the world around it.

### 3.2 Stream the model response

The client sends the prompt to the Responses API and consumes a stream of response events. Streaming lets the UI show commentary as it arrives and lets the runtime recognize tool calls without waiting for one monolithic response.

Connection retries, backoff, and transport fallback belong at this boundary. They are reliability details around the loop, not agent reasoning. A completed response can also provide an identifier that helps preserve continuity or resume work.

### 3.3 Dispatch tool calls

When the model asks to run a command, edit a file, search the web, call an MCP server, or use another tool, the orchestrator resolves the tool by name and invokes its implementation. Independent calls may run in parallel; dependent calls must wait for the observations they require.

Before execution, sensitive actions pass through approval policy and sandbox preparation. The model does not bypass those layers merely by emitting a tool call.

### 3.4 Feed observations back

Tool output becomes new model input. A compiler error, failing test, command exit code, file diff, or search result is not a side channel: it is the evidence that lets the next iteration adapt.

```text
user request
    ↓
build context → call model → tool request → execute tool
      ↑                                      ↓
      └────────────── tool result ───────────┘
```

The loop continues while the model requests more work. When it produces a final response without another tool request, the task can finish.

### 3.5 Persist incrementally

Messages, tool calls, results, and state changes are appended to the rollout as work happens. Incremental persistence matters: a long task should remain inspectable and recoverable even if the process or connection fails before the final answer.

This loop is why verification is so valuable. Tests, builds, linters, and diffs turn assumptions into observations. OpenAI's write-up on [long-horizon Codex tasks](https://developers.openai.com/blog/run-long-horizon-tasks-with-codex) describes the same operating rhythm: plan, edit, run tools, observe, repair, and repeat.

## 4. Tools: one interface, many capabilities

Codex keeps a registry of tools and dispatches calls by name. The implementations differ, but the model sees a common pattern: a name, an input schema, and a result.

### Shell execution

The shell tool runs commands and returns their output and exit status. It is the bridge from language reasoning to compilers, tests, Git, package managers, and project-specific scripts. Because shell access is powerful, it is also the path most tightly connected to approvals and sandboxing.

### `apply_patch`

File editing uses a patch-oriented tool rather than asking the model to rewrite whole files blindly. The format describes add, update, and delete operations, and a streaming parser can validate and apply the patch as it arrives.

Patch-based editing has three useful properties:

1. The intended change is explicit.
2. The resulting diff is easy for a human to inspect.
3. Unrelated content is less likely to be overwritten.

### MCP tools

External Model Context Protocol tools are adapted into the same internal tool shape, so the model can use a remote service much like a built-in capability. Codex acts as an MCP **client** when it connects to external tool servers over transports such as stdio or HTTP and exposes their catalogs to the model.

Older Codex versions could also expose Codex itself as an MCP **server**, allowing another agent or IDE to drive a Codex conversation. That direction is visible in the source snapshot behind this article, but it is no longer the recommended integration path. Current documentation directs new deep integrations to the [Codex app server](https://learn.chatgpt.com/docs/app-server) and automation or CI use cases to the [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk); the legacy Codex MCP server is deprecated.

The architectural lesson survives that migration: protocol adapters should terminate at a stable tool or application boundary rather than leaking transport details into the core loop.

## 5. Sandboxing and approvals: two different gates

Codex's security model separates a policy decision from technical enforcement.

### Approval routing asks “may this action proceed?”

A command is compared with the active approval policy and execution rules. Depending on the result, it may run automatically, prompt the user, or be reviewed by another configured mechanism. Equivalent approved command shapes can be remembered for an appropriate scope so the user is not repeatedly asked the same question.

### The sandbox asks “what can this process actually do?”

Even after approval routing, the command runs under an OS-enforced boundary. Current Codex documentation describes local execution as a combination of an approval policy and a sandbox that normally limits writes to the workspace and keeps network access off by default.

The implementation is platform-specific. In the source snapshot:

| OS | Main enforcement mechanism |
| --- | --- |
| macOS | Seatbelt sandbox profiles |
| Linux | Landlock, seccomp, `no_new_privs`, and bubblewrap where available |
| Windows | Restricted tokens and deny ACLs |

The runtime also applies process hardening, such as constraining tracing or core dumps and scrubbing dangerous loader-related environment variables before launching a child process. Some deployments place the actual spawn operation in a separate executor with a virtual filesystem policy.

Keeping these layers separate is deliberate:

```text
model requests action
        ↓
policy and approval routing
        ↓
per-OS sandbox transformation
        ↓
process execution
        ↓
captured output returned to the loop
```

Approval is not a substitute for containment, and containment is not a substitute for informed approval. The former expresses user intent; the latter limits blast radius. See [Agent approvals & security](https://learn.chatgpt.com/docs/agent-approvals-security) for current behavior and configuration.

## 6. Persistence: why a session can resume

A Codex session is a persistent conversation identified by a stable thread ID. Each user-visible unit of work has its own turn ID. The local rollout is an append-oriented JSONL transcript containing information such as:

- user and agent messages;
- tool calls and results;
- thread and turn metadata;
- token usage and compaction events;
- environment and execution context needed to understand the work.

Depending on the Codex version, active rollout files have appeared under date-partitioned paths inside `~/.codex/sessions/` or related thread storage. Treat that layout as generated implementation state, not as a stable API.

The rollout enables several features:

- **resume** reconstructs enough context to continue the conversation;
- **fork** creates a new line of work from an earlier point;
- **diagnostics** can explain which messages and tools led to an outcome;
- **compaction** summarizes older material when the context window fills;
- **memory extraction** can distill reusable context from eligible completed work.

These files can contain prompts, source code, local paths, commands, and tool output. They should be treated as sensitive. Archiving retains the transcript; deletion removes persisted thread data. The app server exposes explicit operations for both lifecycle choices.

## 7. Memory is derived context, not authority

Conversation persistence and memory solve different problems. A rollout preserves one thread in detail. Memory extracts a smaller amount of potentially useful context so it can help in future threads.

The pipeline is roughly:

```text
session rollout JSONL
        ↓
phase 1: per-thread extraction
        ↓
phase 2: global selection and consolidation
        ↓
reusable local memory files
```

The first phase can produce compact facts about tasks, outcomes, preferences, reusable knowledge, failures, and references, plus a readable summary of the thread and evidence linking the memory back to its source. The second phase selects useful, current entries and consolidates them into the global memory store.

In the implementation snapshot, an extraction record separates `raw_memory`, a readable `rollout_summary`, and a short `rollout_slug`. Version fields such as `source_updated_at` and `generated_at` identify the rollout used to create it. Bookkeeping fields such as `usage_count`, `last_usage`, `selected_for_phase2`, and a phase-two source watermark help the consolidator measure reuse and avoid treating a stale selection as current. These are useful for understanding the pipeline, but they are internal storage details rather than a stable API.

Local Codex memories live under `~/.codex/memories/`. The generated state can include summaries, durable entries, recent inputs, and supporting evidence. Codex waits for eligible threads to become idle before processing them, and it can skip extraction because of age, external-context policy, or available rate limit.

Two controls are intentionally independent:

- `memories.generate_memories` decides whether new chats may contribute to future memory;
- `memories.use_memories` decides whether existing memories may be injected into future sessions.

The `/memories` command changes these choices for the current chat; `config.toml` supplies global defaults. Disabling either control does not delete stored memories and does not stop ordinary session persistence.

The most important rule is conceptual: memory is a **recall layer**, not an authoritative source. Requirements that must always be followed belong in `AGENTS.md` or checked-in project documentation. Memories can be stale, incomplete, or irrelevant to a new task. The current [Codex memories documentation](https://learn.chatgpt.com/docs/customization/memories) makes the same distinction.

## 8. A practical source-reading order

If you want to trace the implementation rather than reading the repository from top to bottom, this order keeps the concepts connected:

1. `codex-rs/docs/protocol_v1.md` or the current protocol documentation — learn the vocabulary and event sequence first.
2. `core/src/session/turn.rs` — find the main agent loop.
3. `core/src/client.rs` — see how Codex talks to the model and consumes streaming responses.
4. `core/src/tools/orchestrator.rs` and `apply-patch/` — follow tool dispatch and file editing.
5. `sandboxing/` and `execpolicy/` — trace policy, approval, and OS enforcement.
6. `AGENTS.md` at the repository root — understand contributor-facing conventions before interpreting or changing the code.

Paths in a fast-moving repository will change. Search by concepts and types when a path no longer exists: thread, turn, rollout, orchestrator, approval, sandbox, and app server are better anchors than a frozen directory tree.

## 9. What the architecture gets right

Several design choices make Codex more than a code-generating chat:

### The UI is decoupled from the engine

A TUI, IDE, desktop app, or custom integration can share the same lifecycle and safety semantics. New frontends do not need to reinvent the agent.

### Feedback is part of reasoning

The loop treats command output and file changes as first-class observations. Codex can repair a failed build because the failure becomes context, not because the model somehow predicted every consequence in advance.

### Safety is layered

Policy, human approval, sandbox transformation, and process execution are distinct components. Each can evolve without collapsing the whole security model into a single yes/no switch.

### State is externalized

Repository files, rollouts, diffs, plans, and memory records give long-running work durable state. The model does not have to carry everything inside one transient response.

### Integration boundaries are explicit

Tools normalize capabilities, the app server normalizes clients, and persistence normalizes continuation. These boundaries are what let the system grow without placing every responsibility inside the model prompt.

## Conclusion

The cleanest way to understand Codex is not “an LLM that can run shell commands.” It is a stateful agent harness built around a model:

```text
context → model → action → guarded execution → observation → persisted context
```

The model supplies judgment, but the surrounding runtime supplies continuity, evidence, permissions, and a real environment. The app server makes the engine usable from many clients; the tool layer makes external capabilities uniform; the approval and sandbox layers make execution governable; rollouts and memory let useful state survive beyond a single response.

Once this loop is visible, Codex's behavior becomes much easier to reason about. A strong prompt helps, but reliable agentic work comes from the whole system: clear instructions, bounded tools, observable results, durable state, and verification at every meaningful step.
