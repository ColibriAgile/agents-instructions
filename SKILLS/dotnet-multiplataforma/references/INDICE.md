# Índice de casos

Gerado por `scripts/catalogo.py indice`. Não edite.

| caso | problema | fase | status | ajuste | detecção |
|---|---|---|---|---|---|
| [pacote-downgrade](casos/pacote-downgrade.md) | NU1605, downgrade de pacote tratado como erro | restore | confirmado | com-risco | log |
| [sdk-ausente](casos/sdk-ausente.md) | global.json pede um SDK que não está instalado | restore | confirmado | seguro | estática |
| [windows-targeting](casos/windows-targeting.md) | Alvo net*-windows sem EnableWindowsTargeting | restore | confirmado | seguro | estática |
| [caminho-caixa](casos/caminho-caixa.md) | Caminho com maiúsculas ou minúsculas diferentes do disco | build | confirmado | seguro | estática |
| [referencia-com](casos/referencia-com.md) | COMReference não é suportado pelo dotnet build | build | sintoma-confirmado | incompativel | estática |
| [caminho-drive](casos/caminho-drive.md) | Caminho fixo com letra de unidade em OutputPath e similares | pos-build | confirmado | com-risco | estática |
| [comando-windows](casos/comando-windows.md) | Exec ou evento de build que só funciona no cmd.exe | pos-build | confirmado | com-risco | estática |
| [teste-dependente-windows](casos/teste-dependente-windows.md) | Testes que supõem caminhos ou programas do Windows | teste | sintoma-confirmado | com-risco | log |
| [api-windows](casos/api-windows.md) | API exclusiva do Windows no código (registro, P/Invoke, serviços) | execucao | sintoma-confirmado | incompativel | estática |
| [net-framework](casos/net-framework.md) | Alvo .NET Framework (net4x) não roda no runtime do .NET | execucao | hipotese | incompativel | estática |
| [ui-windows](casos/ui-windows.md) | Interface WinForms ou WPF só executa no Windows | execucao | sintoma-confirmado | incompativel | estática |
