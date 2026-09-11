---
name: sdd-criar-techspec
description: TechSpec SDD quando há PRD e é preciso especificar a solução; não cria requisitos nem plano de tasks.
argument-hint: --prd nome-da-feature [--atualizar]
---

# Criar TechSpec SDD

1. Resolva `tasks/prd-[slug]/prd.md` e `techspec.md`. Exija PRD; se faltar, indique `sdd-criar-prd`. Leia o PRD uma vez por versão. Reutilize TechSpec existente; atualize somente quando autorizado, preservando IDs.
   **Saída:** fontes e destino exatos, sem sobrescrita implícita.
2. Mapeie cada obrigação do PRD para consequência técnica. Inspecione apenas módulos, callers, contratos, persistência, erros, testes e configuração envolvidos. Reuse padrões existentes; justifique dependências e componentes novos com lacuna comprovada. Consulte documentação primária para dúvidas técnicas externas.
   Meça o terreno onde a mudança vai pousar: leia integralmente [references/refatoracao-preparatoria.md](references/refatoracao-preparatoria.md) e aplique suas medidas aos arquivos que a feature vai modificar. O resultado é o baseline dos hits pré-existentes e, quando dívida estrutural e contato coincidirem, uma recomendação de refatoração preparatória com escopo mínimo. Código existente que a feature apenas lê não gera recomendação.
   **Saída:** toda obrigação possui decisão ou pendência; cada componente tem caminho, responsabilidade e integração; cada arquivo alvo tem baseline medido e destino da dívida encontrada.
3. Identifique stack por projeto afetado. Para C#/.NET, leia integralmente [references/dotnet.md](references/dotnet.md) antes de especificar validação. Em desktop .NET, omita execução E2E e registre `E2E: omitido por política desktop .NET`; preserve aceite com testes menores e roteiro manual quando necessário.
   Especifique também o perfil de qualidade: leia integralmente [references/qualidade-dotnet.md](references/qualidade-dotnet.md) e selecione as regras que esta feature pode violar, com classe e comando de verificação. Regra fora do perfil não é verificada por gate algum. Desvio já decidido vira `DEC-NN` e deixa de ser achado.
   **Saída:** perfil de validação com evidência da stack, runner, projetos, comandos e limitações; perfil de qualidade com regras pertinentes, classes, comandos e justificativas prévias.
4. Leia integralmente [assets/techspec.template.md](assets/techspec.template.md) ao redigir. Use `DEC-01`, `CMP-01`, `TC-01` e IDs do PRD. Cubra contratos, erros, bordas, segurança, concorrência, rollback e rollout aplicáveis, sem duplicar requisitos. Cada obrigação deve ter teste ou outra evidência proporcional; remova seções inaplicáveis.
   **Saída:** todas as obrigações cobertas; decisões não resolvidas explicitamente pendentes, sem impor cobertura percentual.
5. Grave somente a TechSpec. Reporte decisões, lacunas e tasks invalidadas por atualização. No fluxo orquestrado, devolva para elaboração do plano e HIL técnico conjunto.
   **Saída:** artefato revisável com impactos identificados; conflitos de PRD/código/contrato que exigem decisão humana não foram inventados.

Mantenha fontes estáveis antes de código recuperado e estado; releia somente versões alteradas. Ordem de leitura ajuda consistência, mas não garante cache do provedor.
