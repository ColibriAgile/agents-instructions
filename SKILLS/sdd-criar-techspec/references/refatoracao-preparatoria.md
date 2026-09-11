# Refatoração preparatória

Mede o terreno onde a feature vai pousar e decide se ele precisa ser preparado antes. Fowler: *make the change easy, then make the easy change*. A pergunta não é se o código existente é ruim — em base legada quase sempre é — mas se **esta** mudança fica mais cara ou mais arriscada por causa dele. Código feio que a feature só lê não é problema desta feature.

A medição também produz o **baseline**: os hits do perfil de qualidade que já existiam nos arquivos alvo. Sem ele, todo gate a jusante culpa a task pela dívida que encontrou, o ruído vira rotina e o perfil inteiro passa a ser ignorado.

## Medidas

Escopadas aos arquivos da seção **Arquivos relevantes**, nunca ao repositório.

```powershell
$src = @('-g','!**/bin/**','-g','!**/obj/**','-g','!**/*.g.cs','-g','!**/*.Designer.cs')
$alvos = @()   # arquivos que a feature vai modificar

rtk rg -c '^' --type cs @src $alvos | Sort-Object { [int]($_ -split ':')[-1] } -Descending
rtk rg -c --type cs @src 'public (static |async |virtual |override |sealed )*[\w<>\[\], ]+ \w+\(' $alvos
rtk rg -n --type cs @src 'public \w+\((?:[^),]+,){5,}[^)]*\)' $alvos
rtk rg -c --type cs @src '^\s*case ' $alvos
```

| Medida | Limiar estrutural |
| --- | --- |
| Linhas do arquivo | 500+ |
| Membros públicos | 10+ |
| Dependências no construtor | 6+ |
| Casos num `switch`/cadeia `if` sobre o mesmo código | 10+ |

Rode também os comandos do perfil de qualidade (`qualidade-dotnet.md`) sobre os mesmos arquivos: o resultado é o baseline, não uma lista de defeitos a corrigir.

## Decisão

Limiar cruzado não basta. A dívida importa quando a feature **encosta nela**:

- **(a) Estrutural** — o arquivo alvo cruza pelo menos um limiar acima.
- **(b) Contato** — a feature modifica esse arquivo em três ou mais pontos distintos, **ou** estende exatamente a estrutura saturada: mais um caso no `switch` que já tem dez, mais uma dependência no construtor que já tem seis, mais um método na classe que já tem dez públicos.

| Situação | Destino |
| --- | --- |
| Só (a) | **Registrar** no baseline e seguir. A dívida existe, não atrapalha esta mudança. |
| Só (b) | Nada a fazer: contato intenso em arquivo saudável é trabalho normal. |
| (a) **e** (b) | **Recomendar** refatoração preparatória, salvo quando couber em absorção. |

**Absorver** em vez de recomendar quando o preparo é local e cabe na própria feature: extrair um método, introduzir um parameter object, isolar uma dependência. O teste é triplo — não altera contrato público, não exige testes de caracterização novos, e cabe numa task da feature. Registre como `DEC-NN` e trate na implementação.

**Recomendar** quando o preparo altera contrato, exige caracterização antes de mutar, ou atravessa vários arquivos. Nomeie o escopo mínimo que torna a mudança fácil — não a refatoração ideal do arquivo. Uma recomendação que reescreve a classe inteira é recusada com razão; uma que extrai a responsabilidade que a feature vai tocar é aceita.

A recomendação é apresentada no HIL técnico e nunca bloqueia por conta própria. Aprovada, `sdd-planejar-refatoracao` gera os artefatos e a refatoração precede a feature; recusada, vira risco registrado na TechSpec e o baseline continua valendo.

## Registro

Preencha **Baseline do terreno** na seção Perfil de qualidade do template: um item por arquivo alvo, com medidas, hits pré-existentes e destino. Arquivo alvo sem linha no baseline é arquivo não medido — o gate a jusante tratará todo hit nele como novo.

O baseline descreve um estado do código, então sobrevive apenas enquanto esse estado durar. Quando uma refatoração preparatória é aprovada e executada, remeça os arquivos alvo e regrave o baseline antes de replanejar as tasks da feature: manter o baseline antigo perdoaria hits que a refatoração já eliminou. Mudança externa no alvo entre a TechSpec e a implementação tem o mesmo efeito e pede a mesma remedição.
