# Publish to GitHub

Recipes for `--publish`. Everything goes through `gh api`; `R` is `owner/repo`, `N` is the PR number. Bodies come from files (`-F body=@file`) rather than inline shell strings.

## Reviewer identity

GitHub rejects `APPROVE`/`REQUEST_CHANGES` on a PR authored by the authenticated user. Detect identity first:

```powershell
$author = gh api "repos/$repo/pulls/$n" --jq .user.login
$me     = gh api user --jq .login
```

Same login means `event=COMMENT`. For a bot/machine user, `request_changes_workflow: true` permits `REQUEST_CHANGES` only when Critical/Major **defects** are open. Advisories never change the event.

## 1. Upsert the walkthrough comment

One comment per PR, edited in place through its marker:

```powershell
$cid = gh api "repos/$repo/issues/$n/comments" --paginate --jq '[.[] | select(.body | contains("<!-- deep-review:walkthrough -->"))][0].id'
# absent → create; present → edit
gh api "repos/$repo/issues/$n/comments" -F body=@"$out/walkthrough.md"
gh api "repos/$repo/issues/comments/$cid" -X PATCH -F body=@"$out/walkthrough.md"
```

## 2. Anchor defects and advisories

Inline comments must land on changed lines. The valid ranges are in manifest.json. Every in-diff defect **and every in-diff advisory** becomes an inline comment; low severity is not a collapse reason. Outside-diff or drifted anchors move to the matching review-body section. On a GitHub 422 despite the precheck, move that result to the body and continue.

## 3. Post the review submission

`comments.json` has one entry per anchorable defect/advisory. Render `body` from the result block template and preserve its fingerprint marker:

```json
[{ "path": "internal/store/queue.go", "line": 42, "side": "RIGHT",
   "start_line": 38, "start_side": "RIGHT", "body": "<rendered result block>" }]
```

Use `start_line`/`start_side` only for multi-line ranges. The review body starts with `**Defects posted: <n> · Advisories posted: <n>**`, includes Outside diff, Duplicates, and results whose anchors were unavailable, then ends with `Reviewing files that changed between <base> and <head>.`:

```powershell
jq -n --rawfile body "$out/review-body.md" --slurpfile c "$out/comments.json" --arg ev $event '{event:$ev, body:$body, comments:$c[0]}' | Set-Content -Encoding utf8 "$out/review-payload.json"
gh api "repos/$repo/pulls/$n/reviews" --input "$out/review-payload.json"
```

More than 75 inline comments means multiple submissions of at most 75. The first carries the full body; continuations state separate defect/advisory counts.

## 4. Resolve prior-round comments

For each prior defect/advisory marked `resolved`, prepend the resolution while preserving the original body:

```powershell
# PowerShell has no process substitution: stage the new body in a file under $out, then PATCH from it
"✅ Addressed in commit $shortSha`n`n$originalBody" | Set-Content -Encoding utf8 "$out/resolved-$commentId.md"
gh api "repos/$repo/pulls/comments/$commentId" -X PATCH -F body=@"$out/resolved-$commentId.md"
```

Unresolved prior results are not re-posted inline; they appear once under Duplicates.

## 5. Recover state from the PR

For CI or another machine without local state:

```powershell
gh api "repos/$repo/pulls/$n/comments" --paginate --jq '.[].body' | rg -o 'deep-review:fp:[a-f0-9]*'
gh api "repos/$repo/pulls/$n/reviews"  --paginate --jq '.[].body' | rg -o 'deep-review:fp:[a-f0-9]*'
```

Recover the latest `Reviewing files that changed between <base> and <head>.` line as the prior head. A fingerprint absent from the current defects/advisories is resolved only when its file was re-reviewed or left the diff.

## Order and idempotency

1. Verify `gh auth status` and access; detect identity.
2. Upsert walkthrough.
3. Anchor-check every defect/advisory and render fingerprints.
4. Post submission batches.
5. Apply resolution edits.
6. Cite walkthrough and review URLs.

Before posting, check reviews for the same base/head scope line. One review series per round and head SHA is allowed; a match means the publish step already ran.
