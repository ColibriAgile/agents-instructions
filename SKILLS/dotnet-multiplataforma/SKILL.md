---
name: dotnet-multiplataforma
description: Torna projetos .NET (C#, soluções .sln/.slnx, MSBuild) compiláveis tanto no Windows quanto no Linux, diagnosticando e corrigindo o que prende o build a um sistema só, e registrando cada descoberta nova em um catálogo. Tem o modo `auditar`, que só relata o que é ajuste seguro, o que é arriscado e o que é incompatível. Use sempre que um projeto .NET que compila no Windows falhar no Linux, macOS, WSL, contêiner ou CI Linux (ou o contrário), ou quando o usuário falar em auditar, avaliar, portar, compatibilizar, "rodar o build no Linux", multiplataforma ou cross-platform — também diante de erros como CS2001 arquivo não encontrado, NETSDK1100, MSB3073 com código 127, pastas "D:" surgindo no repositório ou testes que falham só fora do Windows, mesmo que o usuário não cite a skill. Não use apenas para instalar o SDK, nem para portar interface WinForms/WPF para outro framework.
compatibility: Python 3.9+ (só biblioteca padrão) e .NET SDK. Os scripts rodam em Windows e Linux.
---

# .NET multiplataforma

O objetivo é um único código-fonte que compila nos dois sistemas. Uma correção que conserta o Linux e muda o
resultado no Windows é uma regressão, por isso toda mudança aqui ou é neutra (a caixa certa de um caminho vale
nos dois) ou é condicionada ao sistema operacional.

**Compilar não é executar.** `net*-windows` (WinForms, WPF) compila no Linux e continua só rodando no Windows.
Diga isso ao usuário quando houver projetos assim.

`<skill-dir>` abaixo é o caminho absoluto da pasta deste arquivo. No Windows, use `py -3` onde os exemplos usam
`python3`.

## Modos

| modo | quando | o que fazer |
|---|---|---|
| `corrigir` (padrão) | pedem para fazer compilar ou ajustar | etapas 1 a 5 abaixo |
| `auditar` | o argumento é `auditar`, ou pedem auditoria, avaliação ou diagnóstico sem alterações | siga [`references/modo-auditar.md`](references/modo-auditar.md) no lugar das etapas abaixo |

No modo `auditar`, nem o projeto nem a skill são alterados. Em dúvida entre os dois, audite: o relatório não impede
corrigir depois.

## 1. Preparar

- Descubra o que o repositório pede: `global.json`, `TargetFramework(s)`, submódulos (`git submodule status`) e as
  instruções do projeto (`AGENTS.md`, `CLAUDE.md`).
- Confira `dotnet --list-sdks`. Sem permissão de administrador, o script oficial `dotnet-install.sh`
  (`https://dot.net/v1/dotnet-install.sh`) instala em `~/.dotnet`.
- Anote o `git status` antes do primeiro build, para separar o que já existia do que você criar.
- Faça os builds exploratórios em uma **cópia** (sem `.git`, `bin`, `obj`) em uma pasta temporária. Um build com
  caminhos do Windows cria arquivos estranhos dentro da árvore, muitas vezes ignorados pelo git.

## 2. Diagnosticar

```
python3 <skill-dir>/scripts/diagnosticar.py <repo>
```

A análise estática é somente leitura e encontra problemas que o build esconde: o MSBuild para na primeira fase que
falha (restore, depois compilação, depois pós-build). Em seguida compile e cruze o log com o catálogo:

```
env -u EnableWindowsTargeting dotnet build <solução> -nologo -v q -clp:Summary > build.log 2>&1
python3 <skill-dir>/scripts/catalogo.py buscar build.log
```

Remover a variável importa: se ela existir na máquina, o build passa aqui e quebra na máquina do colega.
(No PowerShell: `Remove-Item Env:EnableWindowsTargeting`.)

Para cada achado, leia **só** o caso correspondente em `references/casos/<id>.md`; a lista está em
[`references/INDICE.md`](references/INDICE.md). Cada caso tem um `status`:

| status | como tratar |
|---|---|
| `confirmado` | sintoma e correção já foram verificados em build real |
| `sintoma-confirmado` | o problema é real, a correção ainda precisa ser provada |
| `hipotese` | investigue antes de agir |

Erro sem caso no catálogo: investigue a causa e siga a etapa 5.

## 3. Corrigir

Apresente o plano antes de editar quando ele tocar em:

- **submódulo ou biblioteca compartilhada** (o diagnóstico indica): a correção pertence a outro repositório, com
  commit próprio, e atinge outros projetos;
- **versão de pacote ou de SDK**: muda o que é entregue também no Windows;
- **destino de saída do build**: alguém pode depender dele para depurar ou empacotar.

Corrija uma classe de problema por vez e recompile entre elas, para saber o que cada mudança resolveu.
A caixa dos caminhos tem correção automática, em prévia por padrão:

```
python3 <skill-dir>/scripts/corrigir_caixa.py <repo>             # mostra
python3 <skill-dir>/scripts/corrigir_caixa.py <repo> --aplicar   # grava
```

Contornos que servem para investigar, mas não para entregar: links simbólicos com a caixa errada (geram erros
próprios que confundem o diagnóstico), sistema de arquivos sem distinção de caixa, e variáveis de ambiente que só
existem na sua máquina. A correção precisa estar versionada.

## 4. Verificar

1. `diagnosticar.py` sem achados, ou cada achado restante explicado.
2. Build completo a partir de uma cópia limpa, sem variáveis de ambiente de contorno.
3. Nenhuma pasta com nome de unidade criada: procure sem distinguir caixa (`find . -iname '?:'`), porque há
   projetos com `D:\` e com `d:\`, e o `.gitignore` pode escondê-las do `git status`.
4. Testes (`dotnet test`): separe falhas ligadas ao sistema das que também ocorreriam no Windows.
5. **Windows**: se você está no Linux, o lado Windows não foi verificado. Diga isso e peça um build no Windows ou
   proponha CI com matriz `windows-latest` e `ubuntu-latest`, que é o que impede a regressão de voltar.

No relatório final, informe por solução: compila ou não, o que mudou e em qual repositório, o que ficou pendente
e o que não foi verificado.

## 5. Registrar o que foi aprendido

Faz parte da tarefa: um problema novo, uma assinatura de erro nova ou uma receita que falhou voltam para a skill,
senão a próxima execução repete a investigação. O procedimento (um arquivo por caso, checagem opcional, validação)
está em [`references/como-expandir.md`](references/como-expandir.md). A pasta da skill costuma ser um link para o
clone de `agents-instructions`: avise o usuário de que a mudança está lá, sem commit. Se ela for somente leitura,
entregue o texto do caso ao usuário.
