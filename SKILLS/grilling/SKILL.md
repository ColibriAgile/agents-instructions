---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round, giving your recommended answer to each question. Then wait for the user's answers before the next round.

Ask a round through your harness's native question tool (e.g. `AskUserQuestion` in Claude Code) whenever one is available: it shows each question on its own, so none gets skipped in a long message.

- One entry per frontier question. If the frontier exceeds the tool's per-call limit, split it across consecutive calls within the same round.
- Put the question title in the header and the full body (context, trade-offs) in the question text.
- Turn the choices into options. Put your recommended answer first, mark it "(Recommended)", and say why in its description. When there's no natural set of choices, offer your recommendation plus the most plausible alternatives; the user can still answer freely.
- Don't repeat the questions as plain text.

Only when no such tool is available, fall back to asking the round in a single message, numbering each question, formatted like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.
