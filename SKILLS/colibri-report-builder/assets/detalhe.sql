/*macro.relacionamento*/

select
  codigo = i.codigo,
  material = dbo.fn_capitalize(i.material_descr, 0),
  qtd = i.qtd,
  vl_total = cast(i.vl_total as money),
  lancado_em = i.dt_hr_lancamento
from dbo.fn_venda_item(@venda_id, @dia) i
where i.cancelado = 0
  and i.transferido = 0
order by i.dt_hr_lancamento

/*
[relacionamento]
venda_id=venda_id->uniqueidentifier
dia=dia->bit
*/
