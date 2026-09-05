---
name: sdd-criar-techspec
description: TechSpec SDD quando há PRD e é preciso especificar a solução; não cria requisitos nem plano de tasks.
argument-hint: --prd nome-da-feature [--atualizar]
---

# Criar TechSpec SDD

1. Resolva `tasks/prd-[slug]/prd.md` e `techspec.md`. Exija PRD; se faltar, indique `sdd-criar-prd`. Leia o PRD uma vez por versão. Reutilize TechSpec existente; atualize somente quando autorizado, preservando IDs.
   **Saída:** fontes e destino exatos, sem sobrescrita implícita.
2. Mapeie cada obrigação do PRD para consequência técnica. Inspecione apenas módulos, callers, contratos, persistência, erros, testes e configuração envolvidos. Reuse padrões existentes; justifique dependências e componentes novos com lacuna comprovada. Consulte documentação primária para dúvidas técnicas externas.
   **Saída:** toda obrigação possui decisão ou pendência; cada componente tem caminho, responsabilidade e integração.
3. Identifique stack por projeto afetado. Para C#/.NET, leia integralmente [references/dotnet.md](references/dotnet.md) antes de especificar validação. Em desktop .NET, omita execução E2E e registre `E2E: omitido por política desktop .NET`; preserve aceite com testes menores e roteiro manual quando necessário.
   **Saída:** perfil de validação com evidência da stack, runner, projetos, comandos e limitações.
4. Leia integralmente [assets/techspec.template.md](assets/techspec.template.md) ao redigir. Use `DEC-01`, `CMP-01`, `TC-01` e IDs do PRD. Cubra contratos, erros, bordas, segurança, concorrência, rollback e rollout aplicáveis, sem duplicar requisitos. Cada obrigação deve ter teste ou outra evidência proporcional; remova seções inaplicáveis.
   **Saída:** todas as obrigações cobertas; decisões não resolvidas explicitamente pendentes, sem impor cobertura percentual.
5. Grave somente a TechSpec. Reporte decisões, lacunas e tasks invalidadas por atualização. No fluxo orquestrado, devolva para elaboração do plano e HIL técnico conjunto.
   **Saída:** artefato revisável com impactos identificados; conflitos de PRD/código/contrato que exigem decisão humana não foram inventados.

Mantenha fontes estáveis antes de código recuperado e estado; releia somente versões alteradas. Ordem de leitura ajuda consistência, mas não garante cache do provedor.
