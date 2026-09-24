# Decisões de design — [Nome do produto]

Registro das decisões de design do projeto na adoção da linha visual Colibri. As regras vigentes estão em `DESIGN.md` (visual) e `PRODUCT.md` (estratégia); aqui fica o porquê, o quando e o que foge do kit. Acrescente uma entrada nova a cada adoção ou atualização do kit; não reescreva as anteriores.

## [AAAA-MM-DD] Adoção do Colibri Design Kit

- **Versão do kit:** [data da linha "Origem" do LEIA-ME.md do kit]
- **Stack:** [framework e versão; biblioteca de componentes, tema e versão]
- **Arquivos do kit:** [pasta com colibri-ui.css, fonts/, logos/, icons/ ou pacote bootstrap-icons]
- **Adaptadores:** [nenhum | colibri-ui.bootstrap3.css | colibri-ui.devexpress.css, com os blocos mantidos]
- **Ordem de carga:** [arquivo de entrada e ordem dos CSS]
- **Página inicial (`.cm-page--home`):** [rota/arquivo]
- **Página mais usada:** [rota/arquivo] — [o que ela precisa favorecer]
- **Escopo desta etapa:** [documentação apenas | documentação + shell | …]

### Desvios do kit

| Regra do kit | O que foi feito | Motivo | Confirmado por |
|---|---|---|---|
| [ex.: seção 3, fonte em popups] | [ex.: classe interna .dxbl-xyz] | [ex.: tema X não expõe variável pública] | [nome] |

Sem desvios: escreva "Nenhum".

### Páginas a refatorar

- [ ] [página mais usada]
- [ ] [demais páginas]

### Pendências e verificações não realizadas

- [ex.: verificação de fonte nos popups do DevExpress pendente — aplicação não subiu no ambiente]
