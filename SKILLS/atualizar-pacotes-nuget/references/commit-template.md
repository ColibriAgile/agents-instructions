# Mensagens de commit

Leia esta referência quando `_lib` e o repositório principal tiverem alterações separadas. Gere as mensagens sem executar `git commit`.

Use uma mensagem por repositório e mantenha no bloco principal somente os pacotes alterados naquele repositório.

```text
chore(nuget): <título>

<resumo das alterações>

Pacotes atualizados

- <pacote>: <versão anterior> => <versão nova>

Validação

- <comando de build>: <resultado>
- <comando de teste>: <resultado e quantidade>
```

Inclua somente pacotes realmente alterados naquele repositório. Para um pacote novo necessário à migração MTP, use `novo => <versão>` e explique a finalidade no resumo.
