#!/usr/bin/env bash
# Aguarda os builds disparados pelo merge nos branches production*.
# Uso: aguardar-builds.sh <T0-ISO8601> <repo>:<workflow.yml>:<branch> [...]
#   T0: horário UTC um pouco antes do merge (ex.: 2026-10-14T14:43:00Z).
# Emite 1 linha a cada mudança de estado e sai quando todos terminarem.
# Use com a ferramenta Monitor: cada linha vira uma notificação.
org=${ORG:-ColibriAgile}
t0=$1; shift
declare -A ultimo
while true; do
  pendente=0
  for spec in "$@"; do
    IFS=: read -r repo wf branch <<<"$spec"
    linha=$(gh run list -R "$org/$repo" --workflow "$wf" --branch "$branch" --limit 5 \
      --json databaseId,number,status,conclusion,createdAt \
      --jq "[.[] | select(.createdAt >= \"$t0\")] | sort_by(.createdAt) | last
            | if . == null then \"aguardando início\" else \"run \(.databaseId) #\(.number) \(.status) \(.conclusion)\" end" \
      2>/dev/null || echo "erro na API do GitHub")
    case "$linha" in *completed*) ;; *) pendente=1 ;; esac
    if [ "${ultimo[$spec]}" != "$linha" ]; then
      echo "$repo/$wf@$branch: $linha"
      ultimo[$spec]=$linha
    fi
  done
  if [ $pendente = 0 ]; then echo "TODOS OS BUILDS TERMINARAM"; exit 0; fi
  sleep 30
done
