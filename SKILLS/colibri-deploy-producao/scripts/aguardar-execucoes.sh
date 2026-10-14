#!/usr/bin/env bash
# Aguarda execuções de workflow pelo id (deploys disparados ou reexecuções).
# Uso: aguardar-execucoes.sh <repo>:<runId> [...]
# Emite 1 linha quando cada execução termina e sai quando todas terminarem.
# Use com a ferramenta Monitor: cada linha vira uma notificação.
org=${ORG:-ColibriAgile}
declare -A fim
while true; do
  pendente=0
  for spec in "$@"; do
    repo=${spec%%:*}; id=${spec#*:}
    [ -n "${fim[$spec]}" ] && continue
    estado=$(gh run view "$id" -R "$org/$repo" --json status,conclusion \
      --jq '"\(.status) \(.conclusion)"' 2>/dev/null || echo "erro na API do GitHub")
    case "$estado" in
      completed*) echo "$repo run $id: $estado"; fim[$spec]=1 ;;
      *) pendente=1 ;;
    esac
  done
  if [ $pendente = 0 ]; then echo "TODAS AS EXECUÇÕES TERMINARAM"; exit 0; fi
  sleep 20
done
