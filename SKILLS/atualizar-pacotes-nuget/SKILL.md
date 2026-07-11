---
name: atualizar-pacotes-nuget
description: 'Atualiza e padroniza pacotes NuGet em toda uma solução .NET usando dotnet outdated. Use quando for necessário atualizar dependências NuGet, sincronizar versões entre projetos, atualizar primeiro o submódulo _lib, executar build e testes após a atualização ou investigar breaking changes introduzidas por pacotes.'
argument-hint: 'Informe a solução .sln ou .slnx que deve ser atualizada.'
user-invocable: true
---

# Atualizar pacotes NuGet

## Quando usar

Use esta skill para atualizar pacotes NuGet de uma solução .NET de forma controlada e validada. Ela cobre:

- soluções `.sln` e `.slnx`;
- repositórios que possuem o submódulo `_lib`;
- atualização de dependências com `dotnet outdated`;
- build e testes após cada solução atualizada;
- detecção de incompatibilidades e breaking changes.

## Regras de segurança

- Preserve alterações não relacionadas que já estejam no working tree.
- Antes de atualizar, identifique a solução alvo e registre quais soluções serão alteradas.
- Não faça rollback automático, não fixe versões manualmente e não aplique correções para breaking changes sem confirmação do usuário.
- Se build ou testes indicarem que uma atualização quebrou compatibilidade, interrompa o fluxo imediatamente e pergunte se o usuário deseja:
  1. continuar corrigindo a incompatibilidade; ou
  2. fazer rollback e fixar a versão problemática para uma análise posterior.
- Se a ferramenta `dotnet outdated` não estiver disponível e a instalação falhar, interrompa e peça que o usuário instale a ferramenta antes de continuar.

## Procedimento

### 1. Identificar a solução e o submódulo

1. Determine a solução informada pelo usuário. Aceite caminhos relativos ou absolutos e as extensões `.sln` e `.slnx`.
2. Se nenhuma solução for informada, liste somente os arquivos `.sln` e `.slnx` diretamente na pasta principal do projeto, sem pesquisar recursivamente em subpastas.
  - Se houver exatamente uma solução, selecione-a automaticamente como solução principal.
  - Se houver mais de uma solução, pergunte ao usuário qual deve ser atualizada.
  - Se não houver nenhuma solução, peça o caminho da solução principal.
3. Verifique se o repositório contém o submódulo ou diretório `_lib`.
4. Quando `_lib` existir, confirme que ele não está em estado detached HEAD antes de executar qualquer comando `dotnet outdated`. Execute, a partir da raiz do repositório:

  ```bash
  git -C _lib symbolic-ref --quiet --short HEAD
  ```

  O comando deve retornar o nome da branch e código de saída zero. Se falhar ou não retornar uma branch, interrompa o fluxo e solicite que o usuário faça checkout de uma branch no submódulo antes de continuar.
5. Quando `_lib` existir e contiver `CoLib.Library.sln`, atualize essa solução primeiro. Se o arquivo não estiver nesse caminho, localize a solução da biblioteca e confirme o caminho efetivo antes de executar a atualização.
6. Depois, atualize a solução principal selecionada.

A ordem padrão é:

1. `dotnet outdated -u _lib\CoLib.Library.sln`
2. `dotnet build _lib\CoLib.Library.sln`
3. `dotnet test _lib\CoLib.Library.sln`
4. `dotnet outdated -u <solucao-principal.sln ou solucao-principal.slnx>`
5. `dotnet build <solucao-principal.sln ou solucao-principal.slnx>`
6. `dotnet test <solucao-principal.sln ou solucao-principal.slnx>`

Adapte separadores e caminhos ao sistema operacional. O comando equivalente para uma solução `.slnx` é o mesmo, substituindo apenas o caminho do arquivo.

### 2. Verificar `dotnet outdated`

1. Verifique se o comando `dotnet outdated` está disponível. Use o comando `dotnet tool list --global` para confirmar se a ferramenta está instalada globalmente.
2. Se não estiver disponível, tente instalar a ferramenta globalmente com `dotnet tool install --global dotnet-outdated-tool`.
3. Verifique novamente se o comando passou a estar disponível.
4. Se a instalação não funcionar, pare sem atualizar pacotes e solicite ao usuário a instalação manual da ferramenta.

Não substitua `dotnet outdated` por uma atualização manual ou por outro mecanismo sem autorização explícita.

### 3. Atualizar uma solução por vez

Para cada solução, execute `dotnet outdated -u <solucao>` e aguarde a conclusão antes de iniciar a próxima etapa.

Após a atualização, examine o resultado para identificar:

- pacotes que não puderam ser atualizados;
- versões major ou prévias que possam conter breaking changes;
- avisos de dependências incompatíveis;
- falhas de restauração ou de resolução de versões.

Uma falha de restauração já é motivo para interromper e pedir orientação quando puder estar relacionada à atualização.

### 4. Validar imediatamente com build e testes

Após cada solução atualizada, execute, nesta ordem:

1. `dotnet build <solucao>`
2. `dotnet test <solucao>`

Analise o output completo, incluindo erros de compilação, falhas de testes, warnings novos relevantes, falhas de restauração e incompatibilidades de API.

Se o build falhar ou os testes falharem por causa de uma atualização:

- pare antes de atualizar qualquer outra solução;
- identifique o pacote, projeto e erro afetado quando possível;
- informe o que foi atualizado e qual validação falhou;
- pergunte se deve continuar corrigindo a incompatibilidade ou fazer rollback e fixar a versão do pacote.

Não declare sucesso enquanto houver falhas causadas pela atualização.

### 5. Corrigir somente com autorização

Se o usuário escolher continuar:

1. corrija a incompatibilidade de forma mínima, preservando a API e o comportamento existentes quando possível;
2. reexecute o build da solução afetada;
3. reexecute os testes da solução afetada;
4. repita até passar ou até surgir outra decisão de arquitetura/produto que exija confirmação.

Se o usuário escolher rollback:

1. reverta apenas as alterações produzidas pela atualização problemática;
2. fixe explicitamente a versão anterior ou compatível do pacote;
3. execute novamente build e testes;
4. registre o pacote, a versão fixada e o motivo da decisão.

### 6. Gerar mensagens de commit

Depois que todas as soluções forem atualizadas e validadas, gere duas mensagens de commit separadas, sem executar `git commit`:

1. Uma mensagem para as alterações realizadas no submódulo `_lib`.
2. Uma mensagem para as alterações realizadas no repositório principal.

As mensagens devem ser escritas em português sem formatação e compatível com GitHub. Cada mensagem deve conter:

- um título curto e objetivo;
- um resumo das alterações;
- uma lista de todos os pacotes atualizados no respectivo repositório, com a versão no formato `de => para`;
- uma seção de validação com os comandos de build e testes executados e seus resultados.

Quando não houver pacotes atualizados em um dos repositórios, apenas omita. Não misture na mensagem do repositório principal os pacotes atualizados exclusivamente no submódulo `_lib`.

Use esta estrutura para cada mensagem:

```
chore(nuget): <título do commit>

Pacotes atualizados

- `<Pacote>`: `<versão anterior>` => `<versão nova>`

```

### 7. Encerrar com um resumo verificável

Ao concluir com sucesso, informe:

- soluções processadas;
- submódulo `_lib` atualizado, quando aplicável;
- principais pacotes ou famílias de pacotes atualizados;
- resultado de `dotnet build` para cada solução;
- resultado de `dotnet test` e quantidade de testes, quando disponível;
- avisos ou pacotes que permaneceram sem atualização;
- as duas mensagens de commit geradas, uma para `_lib` e outra para o repositório principal;
- arquivos alterados, se essa informação estiver disponível.

Se o fluxo for interrompido, informe claramente o ponto de parada e a decisão que aguarda o usuário.

## Critérios de conclusão

A tarefa só está concluída quando:

- todas as soluções planejadas foram processadas;
- `dotnet outdated -u` terminou sem falha impeditiva;
- o build passou para cada solução atualizada;
- os testes passaram para cada solução atualizada;
- não há breaking change pendente sem decisão do usuário;
- o resumo final distingue sucesso, avisos e itens não resolvidos.
