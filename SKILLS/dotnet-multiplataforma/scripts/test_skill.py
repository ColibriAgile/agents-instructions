import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import caixa  # noqa: E402
import catalogo  # noqa: E402
from corrigir_caixa import corrigir  # noqa: E402
from diagnosticar import executar  # noqa: E402

WIN = "$([MSBuild]::IsOSPlatform('Windows'))"


class ComRepo(unittest.TestCase):
    def setUp(self):
        temporaria = tempfile.TemporaryDirectory()
        self.addCleanup(temporaria.cleanup)
        self.raiz = Path(temporaria.name)
        caixa.limpar_cache()

    def gravar(self, nome, texto):
        destino = self.raiz / nome
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_bytes(texto.encode("utf-8"))
        return destino

    def achados(self, modulo):
        achados, erros = executar(self.raiz, {modulo})
        self.assertEqual([], erros)
        return achados


class Caixa(ComRepo):
    def test_corrige_preservando_bom_crlf_separadores_e_prefixo(self):
        self.gravar("Lib/Source/A.cs", "")
        projeto = self.gravar("Lib/Lib.projitems", '\ufeff<Project>\r\n<Compile Include="$(MSBuildThisFileDirectory)source\\a.cs" />\r\n</Project>\r\n')
        corrigir(self.raiz, aplicar=True)
        self.assertEqual('\ufeff<Project>\r\n<Compile Include="$(MSBuildThisFileDirectory)Source\\A.cs" />\r\n</Project>\r\n',
                         projeto.read_bytes().decode("utf-8"))
        self.assertEqual(([], []), corrigir(self.raiz))

    def test_previa_nao_grava(self):
        self.gravar("Docs/x.md", "")
        solucao = self.gravar("a.sln", 'Project("{1}") = "x", "docs\\x.md", "{2}"\n')
        antes = solucao.read_bytes()
        self.assertEqual(1, len(corrigir(self.raiz)[0]))
        self.assertEqual(antes, solucao.read_bytes())

    def test_lista_separada_por_ponto_e_virgula_e_import(self):
        self.gravar("P/Dir/a.cs", "")
        self.gravar("P/Dir/b.cs", "")
        self.gravar("Comum.props", "<Project />")
        self.gravar("P/p.csproj", '<Project><Import Project="..\\comum.props" /><Compile Include="dir/a.cs;dir/b.cs" /></Project>')
        self.assertEqual({"..\\Comum.props", "Dir/a.cs", "Dir/b.cs"}, {m[3] for m in corrigir(self.raiz)[0]})

    def test_ignora_pacotes_comentarios_ausentes_e_corretos(self):
        self.gravar("newtonsoft.json", "")
        self.gravar("Dir/a.cs", "")
        self.gravar("p.csproj", '<Project><PackageReference Include="Newtonsoft.Json" />'
                    '<!-- <Compile Include="dir/a.cs" /> --><Compile Include="gerado/x.cs" />'
                    '<Compile Include="Dir/a.cs" /><Compile Include="Dir/**/*.cs" /></Project>')
        self.assertEqual([], self.achados("caminho_caixa"))


class Drive(ComRepo):
    def test_aponta_sem_condicao_e_ignora_condicionado(self):
        self.gravar("a.csproj", "<Project><PropertyGroup><OutputPath>d:\\saida</OutputPath></PropertyGroup></Project>")
        self.gravar("b.csproj", f'<Project><PropertyGroup Condition="{WIN}"><OutputPath>D:\\saida</OutputPath></PropertyGroup></Project>')
        self.gravar("c.csproj", f'<Project><PropertyGroup><OutputPath Condition="{WIN}">D:\\saida</OutputPath></PropertyGroup></Project>')
        self.assertEqual(["a.csproj"], [a.arquivo for a in self.achados("caminho_drive")])

    @unittest.skipIf(sys.platform == "win32", "nome de pasta inválido no Windows")
    def test_aponta_pasta_residual_em_minusculas(self):
        (self.raiz / "P" / "d:").mkdir(parents=True)
        self.assertEqual(["P/d:"], [a.arquivo for a in self.achados("caminho_drive")])


class Comandos(ComRepo):
    def test_aponta_comandos_do_windows(self):
        self.gravar("a.csproj", '<Project><Exec Command="xcopy &quot;a&quot; b /Y" />'
                    '<Exec Command="echo X: $(DefineConstants)" /></Project>')
        self.assertEqual(2, len(self.achados("comando_windows")))

    def test_ignora_portaveis_e_condicionados(self):
        self.gravar("a.csproj", '<Project><Exec Command="dotnet tool restore" /><Exec Command="npm run build" />'
                    f'<Target Name="T" Condition="{WIN}"><Exec Command="xcopy a b" /></Target></Project>')
        self.assertEqual([], self.achados("comando_windows"))


class WindowsTargeting(ComRepo):
    PROJETO = "<Project><PropertyGroup><TargetFramework>net11.0-windows</TargetFramework></PropertyGroup></Project>"
    HABILITA = "<Project><PropertyGroup><EnableWindowsTargeting>true</EnableWindowsTargeting></PropertyGroup></Project>"

    def test_vale_apenas_o_props_mais_proximo(self):
        self.gravar("Directory.Build.props", self.HABILITA)
        self.gravar("app/a.csproj", self.PROJETO)
        self.gravar("lib/Directory.Build.props", "<Project />")
        self.gravar("lib/b.csproj", self.PROJETO)
        self.assertEqual(["lib/b.csproj"], [a.arquivo for a in self.achados("windows_targeting")])


class Submodulo(ComRepo):
    def test_identifica_submodulo(self):
        self.gravar("_lib/.git", "gitdir: x")
        self.gravar("_lib/a.csproj", "<Project><OutputPath>D:\\x</OutputPath></Project>")
        self.assertEqual("_lib", self.achados("caminho_drive")[0].submodulo)


class Catalogo(unittest.TestCase):
    def test_catalogo_valido(self):
        self.assertEqual([], catalogo.validar())

    def test_busca_por_sinais(self):
        log = "x : error NETSDK1100: ...\ny : error NU1605: ..."
        self.assertEqual({"windows-targeting", "pacote-downgrade"}, {n for n, _, _ in catalogo.buscar(log)})


if __name__ == "__main__":
    unittest.main()
