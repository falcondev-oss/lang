/** Every text of the landing page and the sidebar, written with lang itself. */
import { group, t } from './lang'

const hero = {
  title: t('Every string in your app, translated and type-checked.', {
    de: 'Jeder Text deiner App, übersetzt und typgeprüft.',
    es: 'Cada texto de tu app, traducido y con tipos.',
    ja: 'アプリのすべての文字列を、翻訳して型チェック。',
    pl: 'Każdy tekst w Twojej aplikacji, przetłumaczony i sprawdzony typami.',
  }),
  lede: t(
    (p: { t: string }) =>
      `Wrap the text you already wrote in ${p.t} and add the other languages right there. The English stays the key, TypeScript checks the rest. For Vue, React and React Native.`,
    {
      de: (p) =>
        `Pack den Text, den du schon geschrieben hast, in ${p.t} und schreib die anderen Sprachen direkt daneben. Das Englische bleibt der Schlüssel, TypeScript prüft den Rest. Für Vue, React und React Native.`,
      es: (p) =>
        `Envuelve el texto que ya escribiste en ${p.t} y añade los otros idiomas justo ahí. El inglés sigue siendo la clave, TypeScript comprueba el resto. Para Vue, React y React Native.`,
      ja: (p) =>
        `書いたテキストを ${p.t} で包み、その場で他の言語を書き足すだけ。英語がそのままキーになり、残りは TypeScript がチェックします。Vue、React、React Native に対応。`,
      pl: (p) =>
        `Owiń tekst, który już masz, w ${p.t} i dopisz pozostałe języki od razu obok. Angielski zostaje kluczem, TypeScript sprawdza resztę. Dla Vue, React i React Native.`,
    },
  ),
  ...group(
    t('Get started', { de: 'Loslegen', es: 'Empezar', ja: 'はじめる', pl: 'Zacznij' }),
    t('Copy install command', {
      de: 'Installationsbefehl kopieren',
      es: 'Copiar comando de instalación',
      ja: 'インストールコマンドをコピー',
      pl: 'Kopiuj polecenie instalacji',
    }),
  ),
}

const playground = {
  hint: t((p: { code: string }) => `Every file is editable. Type ${p.code} for autocomplete.`, {
    de: (p) => `Jede Datei ist editierbar. Tippe ${p.code} für Autovervollständigung.`,
    es: (p) => `Todos los archivos son editables. Escribe ${p.code} para autocompletar.`,
    ja: (p) => `すべてのファイルを編集できます。${p.code} と入力すると補完が出ます。`,
    pl: (p) => `Każdy plik można edytować. Wpisz ${p.code}, aby zobaczyć podpowiedzi.`,
  }),
  scrollHint: t('Scroll for the next step', {
    de: 'Scrollen für den nächsten Schritt',
    es: 'Desplázate para el siguiente paso',
    ja: 'スクロールで次のステップへ',
    pl: 'Przewiń do następnego kroku',
  }),
  step: t((p: { n: number; of: number }) => `Step ${p.n} of ${p.of}`, {
    de: (p) => `Schritt ${p.n} von ${p.of}`,
    es: (p) => `Paso ${p.n} de ${p.of}`,
    ja: (p) => `ステップ ${p.n} / ${p.of}`,
    pl: (p) => `Krok ${p.n} z ${p.of}`,
  }),
  ui: group(
    t('Framework', { de: 'Framework', es: 'Framework', ja: 'フレームワーク', pl: 'Framework' }),
    t('renders', { de: 'Ausgabe', es: 'resultado', ja: '表示', pl: 'wynik' }),
    t('live', { de: 'live', es: 'en vivo', ja: 'ライブ', pl: 'na żywo' }),
    t('No problems', {
      de: 'Keine Probleme',
      es: 'Sin problemas',
      ja: '問題なし',
      pl: 'Brak problemów',
    }),
    t('Compiles. Every language renders.', {
      de: 'Kompiliert. Jede Sprache wird gerendert.',
      es: 'Compila. Todos los idiomas se muestran.',
      ja: 'コンパイル成功。すべての言語が表示されます。',
      pl: 'Kompiluje się. Każdy język się wyświetla.',
    }),
    t('nothing rendered', {
      de: 'nichts gerendert',
      es: 'nada que mostrar',
      ja: '何も表示されていません',
      pl: 'nic nie wyrenderowano',
    }),
    t({ tryIt: 'try it' }, { de: 'probier’s', es: 'pruébalo', ja: '試す', pl: 'wypróbuj' }),
    t({ fixIt: 'fix it' }, { de: 'reparier’s', es: 'arréglalo', ja: '直す', pl: 'napraw' }),
  ),
  /** Titles of the cases, by the case's id in `items.ts`. Code subtitles stay code. */
  items: {
    migrate: t('Migrate existing code', {
      de: 'Bestehenden Code migrieren',
      es: 'Migrar código existente',
      ja: '既存のコードを移行',
      pl: 'Migracja istniejącego kodu',
    }),
    groups: t('Groups and nesting', {
      de: 'Gruppen und Verschachtelung',
      es: 'Grupos y anidación',
      ja: 'グループとネスト',
      pl: 'Grupy i zagnieżdżanie',
    }),
    complete: t('Autocomplete', {
      de: 'Autovervollständigung',
      es: 'Autocompletado',
      ja: '自動補完',
      pl: 'Autouzupełnianie',
    }),
    customKey: t('Custom key for long texts', {
      de: 'Eigener Schlüssel für lange Texte',
      es: 'Clave propia para textos largos',
      ja: '長いテキストにはカスタムキー',
      pl: 'Własny klucz dla długich tekstów',
    }),
    params: t('Parameters', {
      de: 'Parameter',
      es: 'Parámetros',
      ja: 'パラメーター',
      pl: 'Parametry',
    }),
    plurals: t('Plurals', { de: 'Plural', es: 'Plurales', ja: '複数形', pl: 'Liczba mnoga' }),
    zod: t('Zod error messages', {
      de: 'Zod-Fehlermeldungen',
      es: 'Mensajes de error de Zod',
      ja: 'Zod のエラーメッセージ',
      pl: 'Komunikaty błędów Zod',
    }),
    outside: t('Outside of components', {
      de: 'Außerhalb von Komponenten',
      es: 'Fuera de componentes',
      ja: 'コンポーネントの外で',
      pl: 'Poza komponentami',
    }),
    exercise: t('Your turn', {
      de: 'Du bist dran',
      es: 'Tu turno',
      ja: 'あなたの番',
      pl: 'Twoja kolej',
    }),
  },
  subs: {
    complete: t('text. lists every text, typed', {
      de: 'text. listet jeden Text, typisiert',
      es: 'text. lista cada texto, con tipos',
      ja: 'text. で全テキストを型付きで一覧',
      pl: 'text. pokazuje każdy tekst, z typami',
    }),
    plurals: t('plain code, no ICU', {
      de: 'normaler Code, kein ICU',
      es: 'código normal, sin ICU',
      ja: 'ただのコード、ICU は不要',
      pl: 'zwykły kod, bez ICU',
    }),
    exercise: t('the ja translation is missing', {
      de: 'die ja-Übersetzung fehlt',
      es: 'falta la traducción ja',
      ja: 'ja の翻訳がありません',
      pl: 'brakuje tłumaczenia ja',
    }),
  },
}

/** Messages of the Zod form. The form shows them in every language, so all are sent along. */
const validation = {
  required: t('Required', {
    de: 'Pflichtfeld',
    es: 'Obligatorio',
    ja: '必須項目です',
    pl: 'Pole wymagane',
  }),
  invalidEmail: t('Invalid email address', {
    de: 'Ungültige E-Mail-Adresse',
    es: 'Correo electrónico no válido',
    ja: 'メールアドレスが正しくありません',
    pl: 'Nieprawidłowy adres e-mail',
  }),
  tooLong: t((p: { maximum: number }) => `At most ${p.maximum} characters`, {
    de: (p) => `Höchstens ${p.maximum} Zeichen`,
    es: (p) => `Como máximo ${p.maximum} caracteres`,
    ja: (p) => `${p.maximum}文字以内で入力してください`,
    pl: (p) => `Maksymalnie ${p.maximum} znaków`,
  }),
  tooShort: t((p: { minimum: number }) => `At least ${p.minimum} characters`, {
    de: (p) => `Mindestens ${p.minimum} Zeichen`,
    es: (p) => `Al menos ${p.minimum} caracteres`,
    ja: (p) => `${p.minimum}文字以上で入力してください`,
    pl: (p) => `Co najmniej ${p.minimum} znaków`,
  }),
}

const zod = {
  title: t('Zod errors in your reader’s language.', {
    de: 'Zod-Fehler in der Sprache deiner Leser.',
    es: 'Errores de Zod en el idioma de quien lee.',
    ja: 'Zod のエラーを、読み手の言語で。',
    pl: 'Błędy Zod w języku czytelnika.',
  }),
  body: t(
    'A text function is already a valid Zod error message. Zod passes the check’s values, the parameter type is checked against the issue, and the language is read when the schema parses.',
    {
      de: 'Eine Textfunktion ist schon eine gültige Zod-Fehlermeldung. Zod übergibt die Werte der Prüfung, der Parametertyp wird gegen das Issue geprüft, und die Sprache wird beim Parsen gelesen.',
      es: 'Una función de texto ya es un mensaje de error válido para Zod. Zod pasa los valores de la validación, el tipo del parámetro se comprueba contra el issue y el idioma se lee al validar el esquema.',
      ja: 'テキスト関数はそのまま Zod のエラーメッセージになります。Zod がチェックの値を渡し、パラメーターの型は issue と照合され、言語はスキーマの検証時に読み取られます。',
      pl: 'Funkcja tekstu jest już poprawnym komunikatem błędu Zod. Zod przekazuje wartości walidacji, typ parametru jest sprawdzany względem błędu, a język jest odczytywany podczas parsowania schematu.',
    },
  ),
  hint: t(
    'Type into the form. Switch the language. The schema below it is shared by app and backend.',
    {
      de: 'Tipp ins Formular. Wechsle die Sprache. Das Schema darunter teilen sich App und Backend.',
      es: 'Escribe en el formulario. Cambia el idioma. El esquema de abajo lo comparten la app y el backend.',
      ja: 'フォームに入力して、言語を切り替えてみてください。下のスキーマはアプリとバックエンドで共有されています。',
      pl: 'Wpisz coś w formularzu. Zmień język. Schemat poniżej jest wspólny dla aplikacji i backendu.',
    },
  ),
  ...group(
    t('Zod guide →', {
      de: 'Zod-Anleitung →',
      es: 'Guía de Zod →',
      ja: 'Zod ガイド →',
      pl: 'Przewodnik po Zod →',
    }),
    t('Form language', {
      de: 'Formularsprache',
      es: 'Idioma del formulario',
      ja: 'フォームの言語',
      pl: 'Język formularza',
    }),
    t('live, nothing is sent', {
      de: 'live, nichts wird gesendet',
      es: 'en vivo, no se envía nada',
      ja: 'ライブ、何も送信されません',
      pl: 'na żywo, nic nie jest wysyłane',
    }),
    t('Name', { de: 'Name', es: 'Nombre', ja: '名前', pl: 'Imię' }),
    t('Email', { de: 'E-Mail', es: 'Correo', ja: 'メール', pl: 'E-mail' }),
    t('Password', { de: 'Passwort', es: 'Contraseña', ja: 'パスワード', pl: 'Hasło' }),
  ),
}

const safety = {
  title: t('Forget a language, and it does not compile.', {
    de: 'Vergiss eine Sprache, und es kompiliert nicht.',
    es: 'Olvida un idioma y no compila.',
    ja: '言語をひとつ忘れると、コンパイルが通りません。',
    pl: 'Zapomnij o jednym języku, a kod się nie skompiluje.',
  }),
  body: t(
    (p: { t: string }) =>
      `The second argument of ${p.t} must contain every other language and nothing else. The error lands on the line that forgot it.`,
    {
      de: (p) =>
        `Das zweite Argument von ${p.t} muss jede andere Sprache enthalten und sonst nichts. Der Fehler landet in der Zeile, die sie vergessen hat.`,
      es: (p) =>
        `El segundo argumento de ${p.t} debe contener todos los demás idiomas y nada más. El error aparece en la línea que lo olvidó.`,
      ja: (p) =>
        `${p.t} の第 2 引数には他のすべての言語が必要で、それ以外は入れられません。エラーは忘れた行に表示されます。`,
      pl: (p) =>
        `Drugi argument ${p.t} musi zawierać każdy inny język i nic więcej. Błąd pojawia się w linii, która go pominęła.`,
    },
  ),
}

const closing = {
  title: t('No codegen. No JSON. No string paths.', {
    de: 'Kein Codegen. Kein JSON. Keine String-Pfade.',
    es: 'Sin codegen. Sin JSON. Sin rutas en strings.',
    ja: 'コード生成なし。JSON なし。文字列パスなし。',
    pl: 'Bez generowania kodu. Bez JSON. Bez ścieżek w stringach.',
  }),
  guide: t('Read the guide', {
    de: 'Zur Anleitung',
    es: 'Leer la guía',
    ja: 'ガイドを読む',
    pl: 'Przeczytaj przewodnik',
  }),
  foot: t((p: { by: string }) => `MIT licensed. Built by ${p.by}. API design by Julian Meinking.`, {
    de: (p) => `MIT-Lizenz. Gebaut von ${p.by}. API-Design von Julian Meinking.`,
    es: (p) => `Licencia MIT. Hecho por ${p.by}. Diseño de la API de Julian Meinking.`,
    ja: (p) => `MIT ライセンス。開発は ${p.by}。API デザインは Julian Meinking。`,
    pl: (p) => `Licencja MIT. Stworzone przez ${p.by}. Projekt API: Julian Meinking.`,
  }),
}

const sidebar = {
  start: t('Start here', {
    de: 'Los geht’s',
    es: 'Empieza aquí',
    ja: 'はじめに',
    pl: 'Zacznij tutaj',
  }),
  guide: t('Guide', { de: 'Anleitung', es: 'Guía', ja: 'ガイド', pl: 'Przewodnik' }),
  frameworks: t('Frameworks', {
    de: 'Frameworks',
    es: 'Frameworks',
    ja: 'フレームワーク',
    pl: 'Frameworki',
  }),
  reference: t('Reference', {
    de: 'Referenz',
    es: 'Referencia',
    ja: 'リファレンス',
    pl: 'Referencja',
  }),
}

/** Busy words for the background of the landing page, the kind a CLI shows while it thinks. */
const background = group(
  t('Pondering…', { de: 'Grübeln…', es: 'Reflexionando…', ja: '思案中…', pl: 'Rozmyślanie…' }),
  t('Cogitating…', { de: 'Sinnieren…', es: 'Cavilando…', ja: '熟考中…', pl: 'Dumanie…' }),
  t('Percolating…', { de: 'Aufbrühen…', es: 'Filtrando…', ja: '抽出中…', pl: 'Parzenie…' }),
  t('Brewing…', { de: 'Brauen…', es: 'Fermentando…', ja: '醸造中…', pl: 'Warzenie…' }),
  t('Simmering…', { de: 'Köcheln…', es: 'A fuego lento…', ja: '煮込み中…', pl: 'Pyrkanie…' }),
  t('Marinating…', { de: 'Marinieren…', es: 'Marinando…', ja: '漬け込み中…', pl: 'Marynowanie…' }),
  t('Noodling…', {
    de: 'Herumtüfteln…',
    es: 'Dándole vueltas…',
    ja: 'あれこれ考え中…',
    pl: 'Dłubanie…',
  }),
  t('Moseying…', { de: 'Schlendern…', es: 'Paseando…', ja: 'ぶらぶら中…', pl: 'Spacerowanie…' }),
  t('Reticulating splines…', {
    de: 'Splines retikulieren…',
    es: 'Reticulando splines…',
    ja: 'スプラインを網状化中…',
    pl: 'Siatkowanie splajnów…',
  }),
  t('Schlepping…', { de: 'Schleppen…', es: 'Acarreando…', ja: '運搬中…', pl: 'Taszczenie…' }),
  t('Conjuring…', {
    de: 'Herbeizaubern…',
    es: 'Conjurando…',
    ja: '召喚中…',
    pl: 'Wyczarowywanie…',
  }),
  t('Ruminating…', { de: 'Wiederkäuen…', es: 'Rumiando…', ja: '反芻中…', pl: 'Przeżuwanie…' }),
  t('Vibing…', { de: 'Viben…', es: 'Fluyendo…', ja: 'ノリノリ中…', pl: 'Wajbowanie…' }),
  t('Finagling…', { de: 'Hinbiegen…', es: 'Apañando…', ja: 'やりくり中…', pl: 'Kombinowanie…' }),
  t('Honking…', {
    de: 'Hupen…',
    es: 'Tocando la bocina…',
    ja: 'クラクション中…',
    pl: 'Trąbienie…',
  }),
  t('Flibbertigibbeting…', {
    de: 'Herumflattern…',
    es: 'Revoloteando…',
    ja: 'そわそわ中…',
    pl: 'Trzepotanie…',
  }),
  t('Smooshing…', {
    de: 'Zermatschen…',
    es: 'Aplastando…',
    ja: 'むにゅむにゅ中…',
    pl: 'Rozgniatanie…',
  }),
  t('Transmuting…', {
    de: 'Transmutieren…',
    es: 'Transmutando…',
    ja: '錬成中…',
    pl: 'Transmutowanie…',
  }),
  t('Herding cats…', {
    de: 'Katzen hüten…',
    es: 'Arreando gatos…',
    ja: '猫をまとめ中…',
    pl: 'Zaganianie kotów…',
  }),
  t('Translating…', { de: 'Übersetzen…', es: 'Traduciendo…', ja: '翻訳中…', pl: 'Tłumaczenie…' }),
)

export const translations = {
  hero,
  playground,
  validation,
  zod,
  safety,
  closing,
  sidebar,
  background,
}
