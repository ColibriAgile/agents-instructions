---
id: ui-windows
titulo: Interface WinForms ou WPF só executa no Windows
fase: execucao
status: sintoma-confirmado
ajuste: incompativel
checagem: dependencia_windows
verificado_em: Linux, SDK 11.0.100, 2026-11-27 (Windows não testado)
sinais:
  - Microsoft\.WindowsDesktop\.App
---

## Sintoma

O projeto compila no Linux (com `EnableWindowsTargeting`) e não executa: o host pede um runtime que não existe ali.

## Causa

WinForms e WPF dependem do runtime Windows Desktop.

## Correção

Não há ajuste de projeto que faça a interface rodar no Linux.

## Riscos e opções

- **Manter só Windows (recomendado se o produto roda apenas lá):** compilar no Linux serve para verificação; declare isso.
- **Separar a lógica:** mover regras para um projeto `netX.0` sem sufixo, testável nos dois sistemas.
- **Migrar a interface:** para um framework multiplataforma (por exemplo, Avalonia). É um projeto à parte.
- **Excluir do build Linux:** filtro de solução (`.slnf`) sem os projetos de interface.

## Armadilhas

Um projeto que depende de outro `-windows` também precisa ser `-windows`.

## Evidência

Projetos WinForms e WPF mínimos compilaram; a execução do WinForms falhou por falta do runtime. A execução do WPF não foi testada.
