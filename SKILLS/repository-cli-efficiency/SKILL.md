---
name: repository-cli-efficiency
description: "Faz buscas, grep, diff e inspecoes de repositorio com escopo controlado e baixa verbosidade. Use obrigatoriamente ao usar rg, Select-String, git grep, git diff, gh api, buscas recursivas ou revisar muitos arquivos."
argument-hint: "Informe o repositorio, diretorio ou padrao que deve ser pesquisado."
user-invocable: true
---

# Busca e inspecao eficiente de repositorio

## Quando usar

Use esta skill antes de executar buscas recursivas, `rg`, `Select-String`, `git grep`, `git diff`, `gh api` ou inspecoes de muitos arquivos.

## Procedimento

1. Restrinja a busca ao diretorio ou projeto relevante.
2. Prefira `rg` a `Get-ChildItem -Recurse | Select-String`:

   ```powershell
   rtk rg -n -g '*.cs' -g '!**/bin/**' -g '!**/obj/**' 'padrao' <diretorio>
   ```

3. Combine padroes relacionados em uma unica passagem:

   ```powershell
   rtk git --no-pager grep -n -I -E "ServidorCis|PortaDConnect|Historico|Observacao" -- "*.cs"
   ```

4. Se somente os nomes dos arquivos forem necessarios, use `-l`. Se poucos resultados forem necessarios, limite a saida sem reler o repositorio inteiro.
5. Para diffs, comece por `rtk git diff --stat`, `--name-status` e `--check`. Leia o diff completo somente dos arquivos ou trechos relevantes.
6. Use `view_range` para arquivos conhecidos. Nao formate e imprima um arquivo inteiro linha a linha quando uma faixa for suficiente.
7. Nao releia um arquivo temporario grande com um pipeline PowerShell inteiro. Use `rg` com padroes de erro e limites de resultado.
8. Para `gh api`, prefira um caminho conhecido, busca de codigo ou dados locais. `--jq` reduz a saida entregue ao agente, mas um endpoint recursivo ainda pode baixar e processar a arvore inteira.
9. Use `rtk proxy` somente quando a saida completa for realmente necessaria para diagnostico.

## Regras

- Sempre prefixe comandos de shell com `rtk`, conforme as instrucoes globais.
- Exclua pelo menos `bin`, `obj`, `.git`, `packages` e artefatos gerados quando a busca nao precisar deles.
- Nao execute varias buscas repo-wide seriais para padroes que podem ser combinados.
- Nao use `Select-Object -Last N` como substituto de um comando com escopo ou verbosity adequada.
- Nao esconda erros; reduza ruido sem descartar o contexto necessario para diagnostico.

## Criterios de conclusao

- A busca percorreu somente o escopo necessario.
- Padroes relacionados foram combinados quando possivel.
- A primeira inspecao de diff foi estatistica e concisa.
- A saida completa foi carregada somente para arquivos ou falhas relevantes.
