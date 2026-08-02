---
description: "Use when writing or reviewing fundamental C# rules, nullability, XML documentation, cohesion, classes, or type design."
---

# Regras fundamentais de C#

- Preserve o idioma já usado no arquivo (PT-BR ou EN-US); não misture idiomas no mesmo arquivo.
- Mantenha uma classe por arquivo, exceto tipos aninhados.
- Marque como `sealed` as classes que não precisam ser herdadas.
- Exija XMLDoc em classes e métodos públicos; use `<inheritdoc />` em membros herdados.
- Elimine avisos de referência anulável.
- Aplique DRY e mantenha métodos pequenos e focados.
