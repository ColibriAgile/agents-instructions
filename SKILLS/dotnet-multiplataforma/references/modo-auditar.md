# Modo auditar

Responde "o que falta para compilar nos dois sistemas e o que custa ajustar", sem ajustar nada. A pessoa decide
depois, com base no relatório.

## Regras

- Não altere o repositório auditado: nem arquivos, nem git, nem artefatos de build.
- Não altere a skill. Casos novos entram no relatório como proposta.
- Build, testes e experimentos de correção só em cópia fora do repositório.
- Instalar um SDK muda a máquina: se faltar, peça antes ou registre como não verificado.

## 1. Levantar

Anote `git status` do repositório e dos submódulos, para provar no fim que nada mudou. Depois:

```
python3 -B <skill-dir>/scripts/auditar.py <repo> --copia <temp>/copia --saida <temp>/auditoria.md
```

`<temp>` é uma pasta temporária nova. A cópia fica em um subnível porque há projetos que escrevem em `..\`.

## 2. Compilar a cópia, em camadas

Antes do primeiro build, leia o que ele executa (`Exec`, eventos de build, alvos próprios): são comandos reais, que
podem tocar fora da cópia. No **Windows**, um `OutputPath` com letra de unidade grava no disco de verdade: condicione
ou redirecione na cópia antes de compilar.

O MSBuild para na primeira fase que falha, então um build só mostra a primeira camada. Compile (sem a variável
`EnableWindowsTargeting`), cruze o log com `catalogo.py buscar`, aplique **na cópia** a correção do bloqueio e repita
até compilar ou até sobrar o que não tem ajuste. Isso testa as receitas e revela o que estava escondido. Anote, para
cada ajuste aplicado, se resolveu: é a evidência do relatório.

Com o build passando, rode os testes. Antes, identifique os que usam banco, rede, serviços ou credenciais; não os
execute sem autorização e liste-os como não verificados.

## 3. Classificar

| classe | critério |
|---|---|
| **Sem problemas** | neutro para o outro sistema, mudança mecânica, verificável e fácil de reverter |
| **Pode gerar problemas** | muda comportamento, artefato, versão ou build do outro sistema, ou depende de decisão |
| **Incompatibilidade real** | não há ajuste de projeto que faça funcionar no outro sistema |

O rascunho já traz a classe padrão de cada caso. Revise com o que o projeto mostra: um ajuste seguro em geral pode
deixar de ser (outro consumidor, script que depende do caminho). Reclassifique e explique o motivo. Na dúvida, use
"pode gerar problemas". Achado que for falso positivo sai da classe, com a justificativa.

Para os erros sem caso no catálogo, classifique pelo mesmo critério e proponha o caso em "A investigar".

Avalie também o que a análise estática não vê: caminhos e separadores no código C#, scripts de build fora do MSBuild,
dependências nativas, fontes, cultura e codificação. Só relate o que tiver evidência; o resto é "não verificado".

## 4. Entregar

Complete o rascunho, mantendo as três classes separadas:

- **Veredito** no topo, em poucas linhas, por solução: compila nos dois com ajustes seguros; compila, mas depende de
  decisões; ou tem parte que só funciona no Windows. Diga sempre se o limite é de **compilação** ou de **execução**.
- **Sem problemas:** o que mudar, onde, e o comando quando houver.
- **Pode gerar problemas:** para cada item, o que pode dar errado, como perceber, as opções e qual você recomenda.
- **Incompatibilidades reais:** o que deixa de funcionar, as opções com o esforço relativo e a recomendação.
- **Build e testes:** resultado real na cópia, com a quantidade de falhas.
- **Não verificado:** em especial o sistema em que nada foi executado. "Sem problemas" no Windows é uma expectativa
  até alguém compilar lá.

Confirme pelo `git status` que o repositório está como antes, informe onde o relatório ficou (ofereça copiá-lo para
um lugar durável) e pergunte quais itens a pessoa quer aplicar. Aplicar é o modo normal da skill.
