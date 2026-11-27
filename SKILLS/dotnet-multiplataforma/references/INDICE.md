# Índice de casos

Gerado por `scripts/catalogo.py indice`. Não edite.

| caso | problema | fase | status | detecção |
|---|---|---|---|---|
| [pacote-downgrade](casos/pacote-downgrade.md) | NU1605, downgrade de pacote tratado como erro | restore | confirmado | log |
| [sdk-ausente](casos/sdk-ausente.md) | global.json pede um SDK que não está instalado | restore | confirmado | estática |
| [windows-targeting](casos/windows-targeting.md) | Alvo net*-windows sem EnableWindowsTargeting | restore | confirmado | estática |
| [caminho-caixa](casos/caminho-caixa.md) | Caminho com maiúsculas ou minúsculas diferentes do disco | build | confirmado | estática |
| [caminho-drive](casos/caminho-drive.md) | Caminho fixo com letra de unidade em OutputPath e similares | pos-build | confirmado | estática |
| [comando-windows](casos/comando-windows.md) | Exec ou evento de build que só funciona no cmd.exe | pos-build | confirmado | estática |
| [teste-dependente-windows](casos/teste-dependente-windows.md) | Testes que supõem caminhos ou programas do Windows | teste | sintoma-confirmado | log |
