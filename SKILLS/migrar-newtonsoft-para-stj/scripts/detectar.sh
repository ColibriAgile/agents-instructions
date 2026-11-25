#!/usr/bin/env bash
# Conta os padrões de risco da matriz Newtonsoft -> System.Text.Json num repositório git.
#
# Uso:   detectar.sh [revisao] [pathspec...]
#        detectar.sh                      # HEAD, todos os .cs fora de testes
#        detectar.sh 002ba58d             # um commit antigo (inventário do Newtonsoft)
#        detectar.sh HEAD 'DConnect/*.cs' # só um projeto
#        detectar.sh -l G-N1              # lista arquivo:linha de um padrão (id da 1ª coluna)
#
# Execute na raiz do repositório (ou do submódulo). A saída tem: id, linha da matriz, ocorrências, arquivos, descrição.
# As linhas de comentário (// e ///) não contam.
#
# Limites conhecidos (confira à mão):
#   - D-TJS conta também um método de extensão do projeto com o nome ToJsonString (por exemplo sobre o Newtonsoft).
#   - D-DIC lista os dicionários. O script não sabe quais converters estão no perfil que lê cada dicionário.
set -u

LISTAR=""
if [ "${1:-}" = "-l" ]; then LISTAR="$2"; shift 2; fi
REV="${1:-HEAD}"; [ $# -gt 0 ] && shift
if [ $# -eq 0 ]; then set -- '*.cs' ':!*Testes/*' ':!*.Testes/*' ':!*Tests/*' ':!*.Designer.cs'; fi

# Ocorrências no formato arquivo:linha:texto, sem as linhas que são só comentário.
ocorrencias() {
    local regex="$1"; shift
    git grep -I -n -E "$regex" "$REV" -- "$@" | sed "s/^$REV://" | grep -v -E '^[^:]+:[0-9]+:[[:space:]]*//'
}

linha() {
    local id="$1" matriz="$2" desc="$3" regex="$4"; shift 4
    if [ -n "$LISTAR" ]; then
        [ "$LISTAR" = "$id" ] && ocorrencias "$regex" "$@"
        return
    fi
    local achados occ arq
    achados=$(ocorrencias "$regex" "$@")
    [ -z "$achados" ] && return
    occ=$(printf '%s\n' "$achados" | wc -l)
    arq=$(printf '%s\n' "$achados" | cut -d: -f1 | sort -u | wc -l)
    printf '%-7s %-9s %5s occ %4s arq  %s\n' "$id" "$matriz" "$occ" "$arq" "$desc"
}

[ -z "$LISTAR" ] && echo "== A. Newtonsoft que ainda existe (inventário da migração) =="
linha A-PKG  L6,L7   'PackageReference do Newtonsoft'                 'Include="Newtonsoft\.Json|Flurl\.Http\.Newtonsoft|Refit\.Newtonsoft|Mvc\.NewtonsoftJson' '*.csproj' '*.props' '*.targets'
linha A-USE  L6,L7   'using/global using do Newtonsoft'               'using +(static +)?(\w+ *= *)?Newtonsoft\.' "$@"
linha A-ATR  L6      '[JsonProperty]'                                 '\[JsonProperty\b' "$@"
linha A-REQ  V7      '[JsonProperty(Required=...)]'                   'JsonProperty\([^)]*Required' "$@"
linha A-OBJ  W8,W14  '[JsonObject] (NamingStrategy, ItemNullValueHandling)' '\[JsonObject\b' "$@"
linha A-SET  -       'JsonSerializerSettings / DefaultSettings'       'JsonSerializerSettings|JsonConvert\.DefaultSettings' "$@"
linha A-NVH  T9,T10,W8 'NullValueHandling / DefaultValueHandling'     'NullValueHandling|DefaultValueHandling' "$@"
linha A-DAT  D1-D4   'Formato e fuso de data'                         'DateFormatString|DateTimeZoneHandling|DateParseHandling|IsoDateTimeConverter|DateFormatHandling' "$@"
linha A-ESC  W1,W2   'StringEscapeHandling'                           'StringEscapeHandling' "$@"
linha A-FLO  N12,W3  'FloatParseHandling / FloatFormatHandling'       'FloatParseHandling|FloatFormatHandling' "$@"
linha A-TYP  G8      'TypeNameHandling ($type no json gravado)'       'TypeNameHandling' "$@"
linha A-REF  W9      'ReferenceLoopHandling / PreserveReferences'     'ReferenceLoopHandling|PreserveReferencesHandling' "$@"
linha A-ENU  E1,E4   'StringEnumConverter'                            '\bStringEnumConverter' "$@"
linha A-DOM  N1-N15  'JObject / JToken / JArray / JValue'             '\b(JObject|JToken|JArray|JValue|JProperty)\b' "$@"
linha A-VAL  N1,N9   '.Value<T>() / .ToObject<T>()'                   '\.Value<|\.ToObject[<(]' "$@"
linha A-PAT  N13     'SelectToken (JSONPath)'                         'SelectTokens?\(' "$@"
linha A-MRG  N15     'JObject.Merge'                                  '\.Merge\(|JsonMergeSettings' "$@"
linha A-POP  V8      'PopulateObject'                                 'PopulateObject' "$@"
linha A-CNV  G9      'Converter próprio do Newtonsoft'                ': *JsonConverter\b[^<]' "$@"

[ -z "$LISTAR" ] && echo && echo "== B. Atributos e convenções que o STJ ignora sem aviso =="
linha B-DCM  L8      '[DataMember] / [DataContract]'                  '\[DataMember|\[DataContract' "$@"
linha B-ENM  E2      '[EnumMember]'                                   '\[EnumMember' "$@"
linha B-SHD  W6      'ShouldSerializeX()'                             'bool ShouldSerialize[A-Z]' "$@"
linha B-DFV  W7      '[DefaultValue] (só importa com DefaultValueHandling)' '\[DefaultValue\(' "$@"
linha B-CBK  -       'Callbacks [OnDeserialized] etc.'                '\[On(Deserializ|Serializ)(ed|ing)\]|\[OnError\]' "$@"

[ -z "$LISTAR" ] && echo && echo "== C. Formato dos tipos =="
linha C-OBJ  O1-O4,G3 'Propriedade object / Dictionary<string,object>' 'public (required )?(object\??|I?Dictionary<string, *object\??>|List<object\??>|object\??\[\]) [A-Z]\w* *\{' "$@"
linha C-DYN  O5      'dynamic'                                        '\bdynamic\b' "$@"
linha C-REQ  V7      'required em propriedade'                        '^\s*(public|internal) required ' "$@"
linha C-GET  V3,V4   'Coleção só com get'                             'public (I?List|ICollection|I?Dictionary|HashSet|I?Set)<[^>]+>\?? [A-Z]\w* *\{ *get; *\}' "$@"
linha C-PRV  V1      'Setter privado, internal ou protected'          '\{ *get; *(private|internal|protected) (set|init); *\}' "$@"
linha C-FLD  V2      'Tupla em propriedade (campos Item1, Item2)'     'public [^=;(]*\((\w+\??( \w+)?, *)+\w+\??( \w+)?\)\??(\[\])?>* [A-Z]\w* *\{' "$@"
linha C-DEC  T4      'Propriedade decimal?/int?/long?/Guid?/DateTime? (entrada "")' 'public (required )?(decimal|int|long|double|Guid|DateTime|DateTimeOffset|bool)\? [A-Z]\w* *\{' "$@"
linha C-GUI  T8      'Propriedade Guid não anulável'                  'public (required )?Guid [A-Z]\w* *\{' "$@"
linha C-DTM  D1-D3   'Propriedade DateTime / DateTimeOffset'          'public (required )?(DateTime|DateTimeOffset)\?? [A-Z]\w* *\{' "$@"
linha C-EXC  W10,W11 'Exception, Type ou delegate serializado (confira à mão)' 'Serializ\w*\((ex|e|exception|erro)\b' "$@"

[ -z "$LISTAR" ] && echo && echo "== D. Uso do System.Text.Json que falha em tempo de execução =="
linha D-NEW  G5,G6   'new JsonSerializerOptions (deve ser 1 por perfil, estático)' 'new JsonSerializerOptions' "$@"
linha D-SEM  L1,T1,W1 'Serialize/Deserialize sem opções (usa o padrão estrito)' 'JsonSerializer\.(Serialize|Deserialize)(Async|ToNode|ToElement|ToUtf8Bytes|ToDocument)?(<[^(]+>)?\([^,()]+\)' "$@"
linha D-NOD  N9      'node.Deserialize<T>() sem opções'               '\.Deserialize<[^(]+>\(\)' "$@"
linha D-TJS  N10,W1  'ToJsonString() sem opções (escapa acento)'      '\.ToJsonString\(\)' "$@"
linha D-GVL  N1,N2   'GetValue<T>() (tipo exato)'                     '\.GetValue<[^(]+>\(\)' "$@"
linha D-CST  N1,N3   'Cast direto de JsonNode'                        '\((int|long|decimal|double|bool|string|Guid|DateTime)\??\) *\w+(\??\[[^]]+\])+' "$@"
linha D-NUL  N3      'Membro em nó que pode ser null (!. depois de índice)' '\]\!\.(ToString|GetValue|AsObject|AsArray|AsValue|ToJsonString)\(' "$@"
linha D-PAR  N4,N7,L2 'JsonNode.Parse / JsonDocument.Parse'           '(JsonNode|JsonDocument|JsonObject|JsonArray)\.Parse\(' "$@"
linha D-DOC  N14     'JsonDocument / JsonElement (tempo de vida)'     '\bJsonDocument\b|\.RootElement\b' "$@"
linha D-CTX  G1-G4   'Contexto gerado (precisa de teste de contrato)' ': *JsonSerializerContext|\[JsonSerializable\(' "$@"
linha D-RES  G1-G3   'TypeInfoResolver só com contexto'               'TypeInfoResolver *= *\w+\.Default\b' "$@"
linha D-CYC  W9      'ReferenceHandler.IgnoreCycles (escreve null)'   'IgnoreCycles' "$@"
linha D-SNK  W14     'Política SnakeCaseLower / CamelCase'            'JsonNamingPolicy\.(SnakeCase|KebabCase|CamelCase)' "$@"
linha D-CNV  T4,sec9 'Converter de tipo de valor (confira o par T e T?)' ': *(System\.Text\.Json\.Serialization\.)?JsonConverter<(decimal|int|long|double|Guid|DateTime|DateTimeOffset|bool)\??>' "$@"
linha D-ATR  G9      '[JsonConverter] em tipo ou propriedade (a coleção do perfil ganha do tipo)' '\[(System\.Text\.Json\.Serialization\.)?JsonConverter\(typeof' "$@"
linha D-ADD  G9,sec9 'Converters.Add no perfil'                       'Converters\.Add\(|Converters *= *\{' "$@"
linha D-KEY  G10     'Converter de string/Guid/DateTime/bool (precisa de ReadAsPropertyName)' ': *(System\.Text\.Json\.Serialization\.)?JsonConverter<(string|Guid|DateTime|bool)\??>' "$@"
linha D-DIC  G10     'Dicionário em propriedade (a chave passa pelo converter do perfil)' 'public [^=;(]*I?(ReadOnly)?Dictionary<(string|Guid|DateTime|bool|[A-Z]\w*), *[^>]+>+\?? [A-Z]\w* *\{' "$@"
linha D-ENC  W1      'Encoder definido'                               'UnsafeRelaxedJsonEscaping|JavaScriptEncoder\.' "$@"

[ -z "$LISTAR" ] && echo && echo "== E. Bibliotecas HTTP =="
linha E-FLU  sec10   'Chamada JSON do Flurl (confira se passa o perfil)' '\.(GetJsonAsync|ReceiveJson|PostJsonAsync|PutJsonAsync|PatchJsonAsync)\b' "$@"
linha E-FLS  sec10   'Perfil passado ao Flurl'                        'DefaultJsonSerializer|Settings\.JsonSerializer' "$@"
linha E-RFT  sec10   'Refit (padrão: camelCase, sem enum em texto)'   'RestService\.For|AddRefitClient|RefitSettings|SystemTextJsonContentSerializer' "$@"
linha E-MVC  G11     'Opções JSON do ASP.NET Core (um converter muda o binding e o OpenAPI)' 'AddJsonOptions|ConfigureHttpJsonOptions|AddNewtonsoftJson' "$@"
exit 0
