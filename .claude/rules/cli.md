---
paths:
  - "src/**"
  - "tests/**"
  - "bin/**"
  - "docs/specs/**"
---

# Regras da CLI `colibri-skills`

## Texto que o usuário vê

- Todo texto que a CLI mostra na tela é em pt-BR: saída, erros, prévias, prompts e hints do wizard.
- Valores que são contrato ficam em inglês: campos e valores do `--json`, o arquivo de estado, os enums internos e
  os nomes de opções. Traduza só na hora de exibir e nunca o valor guardado.
- Quando uma biblioteca (clack, commander) aceita o texto como opção, passe em pt-BR. Exemplo: `p.confirm` recebe
  `active: 'Sim'` e `inactive: 'Não'`. O que a biblioteca gera por dentro sem opção para trocar fica como exceção.

## Testes

- Teste o comportamento externo pelo ponto mais alto possível. Não teste detalhes de implementação.
- O padrão é a CLI como processo: rode o `bin/colibri-skills.mjs` num diretório temporário e confira a saída, o
  código de saída e os arquivos. Exemplos: `tests/cli.test.mjs`, `tests/lifecycle.test.mjs`.
- Interações que exigem TTY (o wizard, a confirmação) vão no `tests/wizard-pty.py`, que roda só em macOS/Linux.
- Todo texto novo em pt-BR tem um teste que confere o texto em pt-BR. Quando o mesmo dado sai no `--json`, o teste
  também confere que o JSON continua com o valor em inglês.
- Comportamento que muda no Windows precisa de um teste que roda no `win32` ou de um roteiro manual escrito na spec.

## Specs de features e correções

- Antes de implementar, escreva a spec em `docs/specs/<slug>.md`, em pt-BR, seguindo o modelo do `to-spec`.
- A spec lista os pontos de teste escolhidos e segue estas regras.
