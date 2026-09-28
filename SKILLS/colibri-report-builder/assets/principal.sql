select
  venda_id = h.venda_id,
  dia = 1,
  [Dt. contábil] = h.dt_contabil,
  [Ticket] = h.codigo_ticket,
  [Modo de venda] = m.nome,
  [Total] = cast(o.vl_total as money)
from venda h with (nolock)
join operacao o with (nolock) on o.operacao_id = h.operacao_id
left join modo_venda m with (nolock) on m.id = h.modo_venda_id
where h.cancelado = 0
  and h.transferido = 0
  /*macro.filtro+*/
union all
select
  h.venda_id,
  0,
  h.dt_contabil,
  h.codigo_ticket,
  m.nome,
  cast(o.vl_total as money)
from venda_geral h with (nolock)
join operacao_geral o with (nolock) on o.operacao_id = h.operacao_id
left join modo_venda m with (nolock) on m.id = h.modo_venda_id
where h.cancelado = 0
  and h.transferido = 0
  /*macro.filtro+*/
/*macro.ordenacao*/

/*
[filtro.dt]
titulo=Período
tipo=data
campo=h.dt_contabil

[filtro.modo]
tipo=modo-venda
campo=h.modo_venda_id

[ordenacao]
titulo=Principal
Data=[Dt. contábil];obrigatorio
Ticket=[Ticket]
*/
