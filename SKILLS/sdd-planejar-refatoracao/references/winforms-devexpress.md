# WinForms e DevExpress

Leia esta referência somente quando o alvo usar WinForms ou DevExpress.

- Mapeie eventos, bindings, validações, thread de UI, lifecycle de controles e efeitos disparados implicitamente.
- Reuse o padrão arquitetural e o framework de testes já adotados. Introduza Presenter, interface de view ou nova camada somente quando uma dependência não puder ser isolada com a estrutura existente e o trade-off estiver registrado.
- Extraia lógica pura apenas quando isso reduzir acoplamento observável; mantenha adaptação de controles na borda da UI.
- Para grids e relatórios, prefira verificar dados semânticos antes da renderização. Use snapshot ou Golden Master somente com baseline revisado e formato estável.
- Registre roteiro manual para comportamento visual ou lifecycle que não possa ser automatizado proporcionalmente ao risco.
- Trate binding automático, cascata de eventos, foco, seleção, ordenação e atualização cross-thread como riscos explícitos no componente e nos test cases correspondentes.
