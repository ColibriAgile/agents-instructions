# Stryker.NET no nível crítico

Mutation testing é a verificação mecânica do que a seção "O mutante" da skill faz mentalmente. Rode apenas em unidades classificadas como **Críticas**: na solução inteira é o que o torna caro demais para valer a pena.

## Instalação e execução

Instale uma vez:

```
dotnet tool install -g dotnet-stryker
```

Execute a partir da pasta do projeto de teste, restringindo o escopo:

```
dotnet stryker -m "**/Dominio/Precificacao/**" --break-at 80
```

- `-m` limita ao escopo crítico. Alternativa: `--since:master` muta só o que mudou no branch.
- Em projeto migrado para Microsoft.Testing.Platform, some `--test-runner mtp` (dotnet-stryker ≥ 4.13; suporte ainda em preview). Sem essa flag o Stryker tenta VSTest e falha.
- Rode sob demanda ou em job noturno, não no CI de cada PR.

## Como ler o resultado

- **Mutante sobrevivente** → linha nova no plano (comportamento → mutante → teste) e teste novo. Nunca `// Stryker disable`.
- **Mutante equivalente** (a mutação não muda comportamento observável, ex.: `i++` → `++i` em contexto sem uso do valor) → justificativa escrita na resposta, sem teste.
- **Score alto com poucos testes** é o alvo. Se dois testes matam exatamente o mesmo conjunto de mutantes, um deles é redundante: aplique o critério de parada da skill e apague.

O relatório do Stryker também serve para limpar suíte inflada: testes que não aparecem como assassinos de nenhum mutante são candidatos diretos a remoção.
