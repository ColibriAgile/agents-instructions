---
name: insomnia-to-markdown
description: Converte uma collection exportada do Insomnia (JSON v4) em Markdown estruturado para servir de fonte de conhecimento de LLM, wiki interna ou base de RAG. Use sempre que o usuário anexar/apontar um export do Insomnia e pedir documentação, markdown, "documentar a API", "gerar doc da collection", "transformar isso em wiki", ou quiser alimentar um agente/llmwiki com as rotas de uma API. Também use quando ele mencionar documentar endpoints a partir de uma collection, ou pedir para atualizar uma doc já gerada depois que a collection mudou. Não use para specs OpenAPI/Swagger nem para collections do Postman sem antes converter para o formato do Insomnia.
---

# Insomnia → Markdown

Gera Markdown de referência de API a partir de um export do Insomnia, otimizado para ser
recuperado por chunk: cada endpoint vira uma seção autocontida, com método, caminho, headers,
params e payload de exemplo.

## Fluxo

1. **Validar o formato do export.** O script aceita o JSON v4 do Insomnia (tem a chave
   `resources`). Se o arquivo for YAML (Insomnia v5), `.har`, OpenAPI ou export do Postman,
   avisar o usuário e pedir o export correto (`Export > Insomnia v4 (JSON)`) em vez de tentar
   adivinhar o esquema.

2. **Decidir o modo de saída** conforme o destino:
   - **Arquivo único** (default) — bom para colar numa página de wiki ou anexar como contexto.
   - **`--split`** — um `.md` por pasta da collection + `index.md`. Prefira este quando a
     collection passa de ~30 endpoints ou quando a wiki indexa por arquivo, porque cada
     arquivo vira uma unidade de recuperação coerente.

   Se o usuário não disse qual quer e a collection é grande, sugerir o `--split` explicando o
   motivo, mas não travar a conversa esperando resposta — gerar o default e oferecer o outro.

3. **Rodar o script:**

   ```bash
   python scripts/insomnia_to_md.py <export.json> -o docs/api.md
   python scripts/insomnia_to_md.py <export.json> -d docs/api/ --split
   python scripts/insomnia_to_md.py <export.json> -o docs/api-uat.md --env UAT --resolve
   ```

   Flags:
   | Flag | Efeito |
   | --- | --- |
   | `-o/--output` | caminho do `.md` (modo arquivo único) |
   | `-d/--outdir` | pasta de saída |
   | `--split` | um arquivo por pasta + `index.md` |
   | `--env NOME` | documenta só o ambiente cujo nome contém `NOME` |
   | `--resolve` | substitui `{{var}}` pelos valores reais do ambiente |
   | `--title TXT` | sobrescreve o título |

   Só usar `--resolve` quando o usuário pedir a doc "resolvida" para um ambiente específico.
   O default preserva os placeholders, que é o que serve para as duas pontas (UAT e produção)
   e evita congelar IDs de exemplo no documento.

4. **Conferir a saída antes de entregar.** Abrir o arquivo gerado e verificar:
   - contagem de endpoints bate com a collection;
   - nenhum bloco JSON ficou quebrado (payload com `{{var}}` fora de string não faz parse e é
     emitido cru — isso é aceitável, mas vale avisar);
   - segredos: `token`, `password`, `apiKey`, `client_secret` frequentemente vêm preenchidos
     com valor real no export. Se houver qualquer coisa que pareça credencial de verdade,
     avisar o usuário e oferecer substituir por placeholder antes de a doc ir para a wiki.

5. **Entregar o(s) arquivo(s)** e resumir em uma linha: quantos endpoints, quantas seções, e
   qual comando reexecutar quando a collection mudar. A doc é derivada — o usuário vai
   regerar, não editar à mão.

## Formato gerado

Estrutura fixa, para que o resultado seja estável entre execuções (diff limpo no git):

```
front matter YAML (title, type, source, exported_from, generated_at, endpoint_count)
# Título da collection
## Convenções
## Ambientes            → tabela variável/valor por ambiente
## Índice de endpoints  → tabela: # | método | caminho | descrição | seção
## <Pasta>
### `MÉTODO` /caminho   → nome na collection, seção, URL completa, descrição,
                          autenticação, headers, path params, query params, body
```

A repetição de seção e URL dentro de cada endpoint é intencional: o chunk precisa fazer
sentido isolado, quando o recuperador o devolve sem o cabeçalho do documento.

## Personalização

Ajustes de formato (agrupar por recurso em vez de por pasta, emitir tabela de campos do body,
mudar o front matter para o esquema da wiki do usuário) são edições diretas em
`scripts/insomnia_to_md.py` — as funções de renderização (`render_request`, `render_body`,
`build`) são independentes entre si. Copiar o script para um caminho de trabalho antes de
editar, já que a pasta da skill pode ser somente leitura.

## Limitações conhecidas

- Documenta o que a collection contém: **não há schema de resposta**, códigos de status ou
  regras de validação, porque o Insomnia não exporta isso. Se o usuário quiser esses campos,
  eles precisam vir de outra fonte (OpenAPI, código do controller) e serem mesclados depois.
- Scripts de pré/pós-request e chains de resposta do Insomnia são ignorados.
- Requests desabilitados dentro de headers/params são marcados, não removidos.
