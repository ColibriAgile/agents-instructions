#!/usr/bin/env bash
# Mostra o que um deploy enviou ao S3: tag escolhida, pacote baixado e contagem.
# Uso: conferir-deploy.sh <repo>:<runId> [...]
# Um deploy "success" só está certo se o pacote for a versão esperada e
# "Enviados: 1". "Ignorados: 1" quer dizer que o pacote já estava no S3.
org=${ORG:-ColibriAgile}
for spec in "$@"; do
  repo=${spec%%:*}; id=${spec#*:}
  log=$(gh run view "$id" -R "$org/$repo" --log 2>&1)
  tag=$(grep -oE "Tag encontrada: [A-Za-z0-9._/-]+" <<<"$log" | head -1)
  pacote=$(grep -oE "Downloaded [^ ]+\.cmpkg" <<<"$log" | head -1)
  contagem=$(grep -oE "Enviados: [0-9]+ \| Ignorados: [0-9]+ \| Falhas: [0-9]+" <<<"$log" | head -1)
  echo "$repo run $id | ${tag:-tag por prefixo} | ${pacote:-pacote não encontrado no log} | ${contagem:-contagem não encontrada}"
done
