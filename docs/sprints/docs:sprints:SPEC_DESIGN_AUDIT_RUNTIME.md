{\rtf1\ansi\ansicpg1252\cocoartf2868
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\froman\fcharset0 Times-Bold;\f1\froman\fcharset0 Times-Roman;\f2\fmodern\fcharset0 Courier;
\f3\fnil\fcharset0 HelveticaNeue;\f4\fmodern\fcharset0 Courier-Bold;}
{\colortbl;\red255\green255\blue255;\red0\green0\blue0;\red109\green109\blue109;\red0\green0\blue0;
\red16\green19\blue24;\red108\green0\blue181;\red32\green36\blue45;\red14\green110\blue109;\red15\green112\blue1;
\red4\green57\blue181;\red162\green55\blue4;}
{\*\expandedcolortbl;;\cssrgb\c0\c0\c0;\cssrgb\c50196\c50196\c50196;\cssrgb\c0\c0\c0\c84706;
\cssrgb\c7843\c9412\c12157;\cssrgb\c50588\c0\c76078;\cssrgb\c16863\c18824\c23137;\cssrgb\c0\c50196\c50196;\cssrgb\c0\c50196\c0;
\cssrgb\c0\c31765\c76078;\cssrgb\c70196\c29020\c0;}
{\*\listtable{\list\listtemplateid1\listhybrid{\listlevel\levelnfc23\levelnfcn23\leveljc0\leveljcn0\levelfollow0\levelstartat0\levelspace360\levelindent0{\*\levelmarker \{disc\}}{\leveltext\leveltemplateid1\'01\uc0\u8226 ;}{\levelnumbers;}\fi-360\li720\lin720 }{\listname ;}\listid1}
{\list\listtemplateid2\listhybrid{\listlevel\levelnfc23\levelnfcn23\leveljc0\leveljcn0\levelfollow0\levelstartat0\levelspace360\levelindent0{\*\levelmarker \{disc\}}{\leveltext\leveltemplateid101\'01\uc0\u8226 ;}{\levelnumbers;}\fi-360\li720\lin720 }{\listname ;}\listid2}
{\list\listtemplateid3\listhybrid{\listlevel\levelnfc23\levelnfcn23\leveljc0\leveljcn0\levelfollow0\levelstartat0\levelspace360\levelindent0{\*\levelmarker \{disc\}}{\leveltext\leveltemplateid201\'01\uc0\u8226 ;}{\levelnumbers;}\fi-360\li720\lin720 }{\listname ;}\listid3}
{\list\listtemplateid4\listhybrid{\listlevel\levelnfc23\levelnfcn23\leveljc0\leveljcn0\levelfollow0\levelstartat0\levelspace360\levelindent0{\*\levelmarker \{disc\}}{\leveltext\leveltemplateid301\'01\uc0\u8226 ;}{\levelnumbers;}\fi-360\li720\lin720 }{\listname ;}\listid4}
{\list\listtemplateid5\listhybrid{\listlevel\levelnfc23\levelnfcn23\leveljc0\leveljcn0\levelfollow0\levelstartat0\levelspace360\levelindent0{\*\levelmarker \{disc\}}{\leveltext\leveltemplateid401\'01\uc0\u8226 ;}{\levelnumbers;}\fi-360\li720\lin720 }{\listname ;}\listid5}
{\list\listtemplateid6\listhybrid{\listlevel\levelnfc0\levelnfcn0\leveljc0\leveljcn0\levelfollow0\levelstartat1\levelspace360\levelindent0{\*\levelmarker \{decimal\}}{\leveltext\leveltemplateid501\'01\'00;}{\levelnumbers\'01;}\fi-360\li720\lin720 }{\listname ;}\listid6}
{\list\listtemplateid7\listhybrid{\listlevel\levelnfc23\levelnfcn23\leveljc0\leveljcn0\levelfollow0\levelstartat0\levelspace360\levelindent0{\*\levelmarker \{disc\}}{\leveltext\leveltemplateid601\'01\uc0\u8226 ;}{\levelnumbers;}\fi-360\li720\lin720 }{\listname ;}\listid7}}
{\*\listoverridetable{\listoverride\listid1\listoverridecount0\ls1}{\listoverride\listid2\listoverridecount0\ls2}{\listoverride\listid3\listoverridecount0\ls3}{\listoverride\listid4\listoverridecount0\ls4}{\listoverride\listid5\listoverridecount0\ls5}{\listoverride\listid6\listoverridecount0\ls6}{\listoverride\listid7\listoverridecount0\ls7}}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\sa240\partightenfactor0

\f0\b\fs24 \cf0 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 SPEC \'97 Design Audit (runtime, k\'f6rs i browser)
\f1\b0 \

\f0\b \'c4gare:
\f1\b0  Code (Sonnet via Claude Code) 
\f0\b Granskning:
\f1\b0  Opus via Chrome-verktyget efter leverans 
\f0\b Rotorsak f\'f6r existens:
\f1\b0  Sprint 17\'9621 levererade med UI-luckor som ingen grep-baserad audit f\'e5ngade. Ett runtime-script mot DOM:en f\'e5ngar "finns-men-funkar-inte"-fallen som statisk analys missar.\
\pard\pardeftab720\partightenfactor0
\cf3 \strokec3 \
\pard\pardeftab720\sa298\partightenfactor0

\f0\b\fs36 \cf0 \strokec2 1. M\'c5L\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0\fs24 \cf0 En audit-modul som k\'f6rs i browsern mot live-appen, l\'e4ser DOM + computed styles, och returnerar en strukturerad rapport \'f6ver avvikelser fr\'e5n 
\f2\fs26 docs/DESIGN_SYSTEM.md
\f1\fs24 . Rapporten ska vara deterministisk (samma input \uc0\u8594  samma output) och kompakt nog att l\'e4sas som text.\
\pard\pardeftab720\sa240\partightenfactor0

\f0\b \cf0 Inte scope:
\f1\b0  Subjektiv bed\'f6mning ("ser klumpigt ut"). Funktionell testning (klickar, formul\'e4rvalidering). Den h\'e4r auditen \'e4r en visuell-regel-linter, inget annat.\
\pard\pardeftab720\partightenfactor0
\cf3 \strokec3 \
\pard\pardeftab720\sa298\partightenfactor0

\f0\b\fs36 \cf0 \strokec2 2. ARKITEKTUR\
\pard\pardeftab720\sa280\partightenfactor0

\fs28 \cf0 2.1 Filstruktur\
\pard\pardeftab720\qc\partightenfactor0

\f3\b0\fs22 \cf4 \strokec4 \
\
\pard\pardeftab720\partightenfactor0

\f1\fs24 \cf5 \strokec5 src/debug/\
\uc0\u9500 \u9472 \u9472  designAudit/\
\uc0\u9474    \u9500 \u9472 \u9472  index.ts            \'97 entry, exponerar window.__designAudit\
\uc0\u9474    \u9500 \u9472 \u9472  types.ts            \'97 Finding, Report, Rule-typer\
\uc0\u9474    \u9500 \u9472 \u9472  rules/              \'97 en fil per regelgrupp (se avsnitt 4)\
\uc0\u9474    \u9474    \u9500 \u9472 \u9472  cardPadding.ts\
\uc0\u9474    \u9474    \u9500 \u9472 \u9472  sectionLabels.ts\
\uc0\u9474    \u9474    \u9500 \u9472 \u9472  hexColors.ts\
\uc0\u9474    \u9474    \u9500 \u9472 \u9472  gridGaps.ts\
\uc0\u9474    \u9474    \u9500 \u9472 \u9472  chevronButtons.ts\
\uc0\u9474    \u9474    \u9500 \u9472 \u9472  emojiConsistency.ts\
\uc0\u9474    \u9474    \u9500 \u9472 \u9472  fontSizes.ts\
\uc0\u9474    \u9474    \u9500 \u9472 \u9472  overlaps.ts\
\uc0\u9474    \u9474    \u9492 \u9472 \u9472  consoleErrors.ts\
\uc0\u9474    \u9492 \u9472 \u9472  reporter.ts         \'97 format output som text + JSON\
\pard\pardeftab720\sa280\partightenfactor0

\f0\b\fs28 \cf0 \strokec2 2.2 Exponering\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0\fs24 \cf0 I 
\f2\fs26 src/main.tsx
\f1\fs24  (eller n\'e4rmsta root):\
\pard\pardeftab720\qc\partightenfactor0

\f3\fs22 \cf4 \strokec4 \
\
\pard\pardeftab720\partightenfactor0

\f1\fs24 \cf0 \strokec2 ts\
\pard\pardeftab720\partightenfactor0
\cf6 \strokec6 if\cf5 \strokec5  \cf7 \strokec7 (\cf6 \strokec6 import\cf7 \strokec7 .\cf5 \strokec5 meta\cf7 \strokec7 .\cf5 \strokec5 env\cf7 \strokec7 .\cf8 \strokec8 DEV\cf5 \strokec5  || \cf6 \strokec6 import\cf7 \strokec7 .\cf5 \strokec5 meta\cf7 \strokec7 .\cf5 \strokec5 env\cf7 \strokec7 .\cf8 \strokec8 VITE_AUDIT_ENABLED\cf5 \strokec5  === \cf9 \strokec9 'true'\cf7 \strokec7 )\cf5 \strokec5  \cf7 \strokec7 \{\cf5 \strokec5 \
  \cf6 \strokec6 import\cf7 \strokec7 (\cf9 \strokec9 './debug/designAudit'\cf7 \strokec7 ).\cf10 \strokec10 then\cf7 \strokec7 (\cf5 \strokec5 m => \cf7 \strokec7 \{\cf5 \strokec5 \
    \cf7 \strokec7 (\cf11 \strokec11 window\cf5 \strokec5  \cf6 \strokec6 as\cf5 \strokec5  \cf11 \strokec11 any\cf7 \strokec7 ).\cf5 \strokec5 __designAudit = m\cf7 \strokec7 .\cf5 \strokec5 runAudit\
  \cf7 \strokec7 \})\cf5 \strokec5 \
\pard\pardeftab720\partightenfactor0
\cf7 \strokec7 \}\cf5 \strokec5 \
\pard\pardeftab720\sa240\partightenfactor0
\cf0 \strokec2 F\'f6r Vercel: s\'e4tt 
\f2\fs26 VITE_AUDIT_ENABLED=true
\f1\fs24  i Vercel env vars. Scriptet \'e4r ~5-10 kB, f\'f6rsumbart.\
\pard\pardeftab720\sa280\partightenfactor0

\f0\b\fs28 \cf0 2.3 API\
\pard\pardeftab720\qc\partightenfactor0

\f3\b0\fs22 \cf4 \strokec4 \
\
\pard\pardeftab720\partightenfactor0

\f1\fs24 \cf0 \strokec2 ts\
\pard\pardeftab720\partightenfactor0
\cf11 \strokec11 window\cf7 \strokec7 .\cf10 \strokec10 __designAudit\cf7 \strokec7 ()\cf5 \strokec5 : \cf11 \strokec11 Promise\cf5 \strokec5 <\cf11 \strokec11 Report\cf5 \strokec5 >\
\cf11 \strokec11 window\cf7 \strokec7 .\cf10 \strokec10 __designAudit\cf7 \strokec7 (\{\cf5 \strokec5  format: \cf9 \strokec9 'text'\cf5 \strokec5  \cf7 \strokec7 \})\cf5 \strokec5 : \cf11 \strokec11 Promise\cf5 \strokec5 <\cf11 \strokec11 string\cf5 \strokec5 >\
\cf11 \strokec11 window\cf7 \strokec7 .\cf10 \strokec10 __designAudit\cf7 \strokec7 (\{\cf5 \strokec5  format: \cf9 \strokec9 'json'\cf5 \strokec5  \cf7 \strokec7 \})\cf5 \strokec5 : \cf11 \strokec11 Promise\cf5 \strokec5 <\cf11 \strokec11 Report\cf5 \strokec5 >\
\cf11 \strokec11 window\cf7 \strokec7 .\cf10 \strokec10 __designAudit\cf7 \strokec7 (\{\cf5 \strokec5  rules: \cf7 \strokec7 [\cf9 \strokec9 'cardPadding'\cf7 \strokec7 ,\cf5 \strokec5  \cf9 \strokec9 'hexColors'\cf7 \strokec7 ]\cf5 \strokec5  \cf7 \strokec7 \})\cf5 \strokec5 : \cf11 \strokec11 Promise\cf5 \strokec5 <\cf11 \strokec11 Report\cf5 \strokec5 >\
\pard\pardeftab720\sa240\partightenfactor0
\cf0 \strokec2 Default: k\'f6r alla regler, returnera 
\f2\fs26 Report
\f1\fs24  (JSON-objekt).\
\pard\pardeftab720\sa280\partightenfactor0

\f0\b\fs28 \cf0 2.4 Types\
\pard\pardeftab720\qc\partightenfactor0

\f3\b0\fs22 \cf4 \strokec4 \
\
\pard\pardeftab720\partightenfactor0

\f1\fs24 \cf0 \strokec2 ts\
\pard\pardeftab720\partightenfactor0
\cf6 \strokec6 export\cf5 \strokec5  \cf6 \strokec6 type\cf5 \strokec5  \cf11 \strokec11 Severity\cf5 \strokec5  = \cf9 \strokec9 'error'\cf5 \strokec5  | \cf9 \strokec9 'warn'\cf5 \strokec5  | \cf9 \strokec9 'info'\cf5 \strokec5 \
\
\cf6 \strokec6 export\cf5 \strokec5  \cf6 \strokec6 interface\cf5 \strokec5  \cf11 \strokec11 Finding\cf5 \strokec5  \cf7 \strokec7 \{\cf5 \strokec5 \
  rule: \cf11 \strokec11 string\cf5 \strokec5 \
  severity: \cf11 \strokec11 Severity\cf5 \strokec5 \
  message: \cf11 \strokec11 string\cf5 \strokec5 \
  selector: \cf11 \strokec11 string\cf5 \strokec5 \
  component?: \cf11 \strokec11 string\cf5 \strokec5 \
  actual: \cf11 \strokec11 string\cf5 \strokec5 \
  expected: \cf11 \strokec11 string\cf5 \strokec5 \
  screenPath: \cf11 \strokec11 string\cf5 \strokec5 \
\pard\pardeftab720\partightenfactor0
\cf7 \strokec7 \}\cf5 \strokec5 \
\
\pard\pardeftab720\partightenfactor0
\cf6 \strokec6 export\cf5 \strokec5  \cf6 \strokec6 interface\cf5 \strokec5  \cf11 \strokec11 Report\cf5 \strokec5  \cf7 \strokec7 \{\cf5 \strokec5 \
  timestamp: \cf11 \strokec11 string\cf5 \strokec5 \
  screenPath: \cf11 \strokec11 string\cf5 \strokec5 \
  totalFindings: \cf11 \strokec11 number\cf5 \strokec5 \
  byRule: \cf11 \strokec11 Record\cf5 \strokec5 <\cf11 \strokec11 string\cf7 \strokec7 ,\cf5 \strokec5  \cf11 \strokec11 number\cf5 \strokec5 >\
  bySeverity: \cf11 \strokec11 Record\cf5 \strokec5 <\cf11 \strokec11 Severity\cf7 \strokec7 ,\cf5 \strokec5  \cf11 \strokec11 number\cf5 \strokec5 >\
  findings: \cf11 \strokec11 Finding\cf7 \strokec7 []\cf5 \strokec5 \
\pard\pardeftab720\partightenfactor0
\cf7 \strokec7 \}\cf5 \strokec5 \
\pard\pardeftab720\partightenfactor0
\cf3 \strokec3 \
\pard\pardeftab720\sa298\partightenfactor0

\f0\b\fs36 \cf0 \strokec2 3. EXEKVERING\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0\fs24 \cf0 Scriptet auditerar bara den aktuella sk\'e4rmen \'97 anroparen (Opus) navigerar mellan sk\'e4rmar och k\'f6r per sk\'e4rm. Ingen routing i scriptet.\
\pard\pardeftab720\sa240\partightenfactor0

\f2\fs26 \cf0 overlaps
\f1\fs24 -regeln beh\'f6ver 
\f2\fs26 requestAnimationFrame
\f1\fs24 . 
\f2\fs26 runAudit
\f1\fs24  returnerar en Promise.\
\pard\pardeftab720\partightenfactor0
\cf3 \strokec3 \
\pard\pardeftab720\sa298\partightenfactor0

\f0\b\fs36 \cf0 \strokec2 4. REGLER\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0\fs24 \cf0 Varje regel: 
\f2\fs26 (root: HTMLElement) => Finding[]
\f1\fs24 . Root = 
\f2\fs26 document.body
\f1\fs24  som default.\
\pard\pardeftab720\sa280\partightenfactor0

\f0\b\fs28 \cf0 4.1 
\f4\fs30\fsmilli15210 cardPadding
\f0\fs28  \'97 DESIGN_SYSTEM.md \'a72\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls1\ilvl0
\f2\b0\fs26 \cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 .card-sharp
\f1\fs24 : padding 
\f2\fs26 10px 12px
\f1\fs24  eller 
\f2\fs26 7px 10px
\f1\fs24  (enrader). Annat = error.\
\ls1\ilvl0
\f2\fs26 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 .card-round
\f1\fs24 : padding 
\f2\fs26 8px 12px
\f1\fs24 . Annat = error.\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls1\ilvl0\cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 Inline 
\f2\fs26 borderRadius
\f1\fs24  p\'e5 element som INTE har klass 
\f2\fs26 card-sharp
\f1\fs24 /
\f2\fs26 card-round
\f1\fs24 /
\f2\fs26 btn
\f1\fs24 /inneh\'e5ller "tab"/"pill"/"nudge"/"bar"/"cta"/"phase"/"pitch" \uc0\u8594  warn.\
\pard\pardeftab720\sa280\partightenfactor0

\f0\b\fs28 \cf0 4.2 
\f4\fs30\fsmilli15210 sectionLabels
\f0\fs28  \'97 DESIGN_SYSTEM.md \'a72\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0\fs24 \cf0 Hitta element med 
\f2\fs26 text-transform: uppercase
\f1\fs24  OCH 
\f2\fs26 letter-spacing >= 1.5px
\f1\fs24 .\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls2\ilvl0
\f2\fs26 \cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 font-size
\f1\fs24  ska vara 
\f2\fs26 8px
\f1\fs24  (error)\
\ls2\ilvl0
\f2\fs26 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 letter-spacing
\f1\fs24  ska vara 
\f2\fs26 2px
\f1\fs24  (error)\
\ls2\ilvl0
\f2\fs26 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 font-weight >= 600
\f1\fs24  (error)\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls2\ilvl0\cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 Text ska b\'f6rja med emoji (warn om inte). Regex: 
\f2\fs26 /^\\p\{Extended_Pictographic\}/u
\f1\fs24 \
\pard\pardeftab720\sa280\partightenfactor0

\f0\b\fs28 \cf0 4.3 
\f4\fs30\fsmilli15210 hexColors
\f0\fs28  \'97 DESIGN_SYSTEM.md \'a79\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0\fs24 \cf0 L\'e4s 
\f2\fs26 el.getAttribute('style')
\f1\fs24  som str\'e4ng. Regex 
\f2\fs26 /#[0-9a-fA-F]\{3,8\}/g
\f1\fs24 . Matcher = error.\
Undanta: 
\f2\fs26 <svg>
\f1\fs24  och alla dess descendants, element med 
\f2\fs26 data-allow-hex="true"
\f1\fs24 .\
\pard\pardeftab720\sa280\partightenfactor0

\f0\b\fs28 \cf0 4.4 
\f4\fs30\fsmilli15210 gridGaps
\f0\fs28  \'97 DESIGN_SYSTEM.md \'a74\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls3\ilvl0
\f1\b0\fs24 \cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 Grid med exakt tv\'e5 
\f2\fs26 1fr
\f1\fs24 -kolumner: f\'f6rv\'e4ntat 
\f2\fs26 gap: 6px
\f1\fs24 . Annat = warn.\
\ls3\ilvl0\kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 Flex-column: f\'f6rv\'e4ntat 
\f2\fs26 gap: 4-6px
\f1\fs24 . St\'f6rre = warn.\
\pard\pardeftab720\sa240\partightenfactor0
\cf0 K\'f6r som warn, inte error. Legitima undantag finns.\
\pard\pardeftab720\sa280\partightenfactor0

\f0\b\fs28 \cf0 4.5 
\f4\fs30\fsmilli15210 chevronButtons
\f0\fs28  \'97 DESIGN_SYSTEM.md \'a72\
\pard\pardeftab720\sa240\partightenfactor0

\f2\b0\fs26 \cf0 <button>
\f1\fs24  d\'e4r 
\f2\fs26 textContent.trim() === '\'9b'
\f1\fs24 : width 16, height 16, border-radius 4. Avvikelse = error.\
\pard\pardeftab720\sa280\partightenfactor0

\f0\b\fs28 \cf0 4.6 
\f4\fs30\fsmilli15210 emojiConsistency
\f0\fs28  \'97 DESIGN_SYSTEM.md \'a718\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0\fs24 \cf0 S\'f6k 
\f2\fs26 document.body.innerText
\f1\fs24 :\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls4\ilvl0
\f2\fs26 \cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 \uc0\u9917 
\f1\fs24  \uc0\u8594  error (bandy = \u55356 \u57298 )\
\ls4\ilvl0
\f2\fs26 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 \uc0\u55357 \u57320 
\f1\fs24  eller 
\f2\fs26 \uc0\u55357 \u57317 
\f1\fs24  \uc0\u8594  error (bandy har 10 min utvisning)\
\pard\pardeftab720\sa280\partightenfactor0

\f0\b\fs28 \cf0 4.7 
\f4\fs30\fsmilli15210 fontSizes
\f0\fs28  \'97 DESIGN_SYSTEM.md \'a710\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls5\ilvl0
\f2\b0\fs26 \cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 font-size < 8px
\f1\fs24  \uc0\u8594  error\
\ls5\ilvl0
\f2\fs26 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 font-size 9-10px
\f1\fs24  + 
\f2\fs26 text-transform: uppercase
\f1\fs24  + 
\f2\fs26 letter-spacing > 1px
\f1\fs24  \uc0\u8594  warn (troligen fel sektions-label)\
\pard\pardeftab720\sa280\partightenfactor0

\f0\b\fs28 \cf0 4.8 
\f4\fs30\fsmilli15210 overlaps
\f0\fs28  \'97 LESSONS.md #9\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0\fs24 \cf0 Enkel variant: hitta element med 
\f2\fs26 position: sticky
\f1\fs24  som \'e4r descendant till ett element med 
\f2\fs26 overflow-y: auto
\f1\fs24  och \'e4r inuti 
\f2\fs26 .card-sharp
\f1\fs24  \uc0\u8594  warn ("sticky inuti scroll-container, m\'f6jlig LESSONS #9").\
Dyrare variant (senare): faktisk BoundingClientRect-j\'e4mf\'f6relse.\
\pard\pardeftab720\sa280\partightenfactor0

\f0\b\fs28 \cf0 4.9 
\f4\fs30\fsmilli15210 consoleErrors
\f0\fs28  \'97 live monitor\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0\fs24 \cf0 N\'e4r modulen laddas, patcha 
\f2\fs26 console.error
\f1\fs24  och 
\f2\fs26 console.warn
\f1\fs24  att pusha till 
\f2\fs26 window.__auditConsoleBuffer
\f1\fs24 .\
Vid 
\f2\fs26 runAudit()
\f1\fs24 : l\'e4s bufferten, l\'e4gg till som findings.\
Exponera 
\f2\fs26 window.__clearAuditBuffer()
\f1\fs24 .\
S\'e4rskild: error med "Minimum update depth exceeded" \uc0\u8594  rule 
\f2\fs26 reactInfiniteLoop
\f1\fs24 , severity error (LESSONS #3, #7).\
\pard\pardeftab720\partightenfactor0
\cf3 \strokec3 \
\pard\pardeftab720\sa298\partightenfactor0

\f0\b\fs36 \cf0 \strokec2 5. REPORTER\
\pard\pardeftab720\sa280\partightenfactor0

\fs28 \cf0 Text-format\
\pard\pardeftab720\qc\partightenfactor0

\f3\b0\fs22 \cf4 \strokec4 \
\
\pard\pardeftab720\partightenfactor0

\f1\fs24 \cf5 \strokec5 \uc0\u9552 \u9552 \u9552  DESIGN AUDIT \u9552 \u9552 \u9552 \
Path: /game/dashboard\
2026-04-20T14:32:11Z\
17 findings (3 error, 11 warn, 3 info)\
\
\uc0\u9472 \u9472  cardPadding (4 findings) \u9472 \u9472 \
\uc0\u10060  card-sharp med padding 14px 16px (f\'f6rv\'e4ntat 10px 12px)\
   at: main > div:nth-child(3) > .card-sharp\
   component: DailyBriefing (guessed)\
\uc0\u9888 \u65039   Inline borderRadius p\'e5 ok\'e4nd komponent\
   at: div.custom-promo-box\
   actual: borderRadius: 12\
...\
\pard\pardeftab720\sa280\partightenfactor0

\f0\b\fs28 \cf0 \strokec2 JSON-format\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0\fs24 \cf0 Returnera 
\f2\fs26 Report
\f1\fs24  per 2.4.\
\pard\pardeftab720\partightenfactor0
\cf3 \strokec3 \
\pard\pardeftab720\sa298\partightenfactor0

\f0\b\fs36 \cf0 \strokec2 6. IMPLEMENTATIONSORDNING\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls6\ilvl0
\f1\b0\fs24 \cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	1	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 Types + tomma regelmoduler + reporter + main.tsx-integration. Verifiera 
\f2\fs26 window.__designAudit()
\f1\fs24  returnerar 
\f2\fs26 \{ findings: [] \}
\f1\fs24 .\
\ls6\ilvl0\kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	2	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 Regel f\'f6r regel i ordningen ovan. Manuell k\'f6rning mot dev-appen efter varje.\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls6\ilvl0
\f2\fs26 \cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	3	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 src/debug/designAudit/__tests__/
\f1\fs24  \'97 en test per regel med minimalt DOM-fragment.\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls6\ilvl0\cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	4	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 Uppdatera DESIGN_SYSTEM.md \'a719 med k\'f6rinstruktion.\
\pard\pardeftab720\partightenfactor0
\cf3 \strokec3 \
\pard\pardeftab720\sa298\partightenfactor0

\f0\b\fs36 \cf0 \strokec2 7. LEVERANSKRITERIER\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls7\ilvl0
\f2\b0\fs26 \cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 window.__designAudit
\f1\fs24  finns i b\'e5de dev och Vercel preview\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls7\ilvl0\cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 Alla 9 regler implementerade + passerar enhetstester\
\ls7\ilvl0\kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 Rapport-format matchar \'a75 bokstavligt\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls7\ilvl0
\f2\fs26 \cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 VITE_AUDIT_ENABLED=true
\f1\fs24  i Vercel env f\'f6r bandy-manager.vercel.app\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls7\ilvl0\cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 DESIGN_SYSTEM.md \'a719 uppdaterad\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls7\ilvl0
\f2\fs26 \cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 npm run build && npm test
\f1\fs24  passerar\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls7\ilvl0\cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 Inga falska positiva p\'e5 nuvarande dashboard (om de finns \uc0\u8594  antingen fel regel eller genuin bugg, rapportera vilket)\
\pard\tx220\tx720\pardeftab720\li720\fi-720\partightenfactor0
\ls7\ilvl0
\f2\fs26 \cf0 \kerning1\expnd0\expndtw0 \outl0\strokewidth0 {\listtext	\uc0\u8226 	}\expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 SPRINT_DESIGN_AUDIT_RUNTIME_AUDIT.md
\f1\fs24  per CLAUDE.md-mall, med verifiering mot vercel-deploy\
\pard\pardeftab720\partightenfactor0
\cf3 \strokec3 \
\pard\pardeftab720\sa298\partightenfactor0

\f0\b\fs36 \cf0 \strokec2 8. REGLER MOT "F\'d6RB\'c4TTRINGAR"\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0\fs24 \cf0 Kopiera bokstavligt. \'c4ndra ingen padding, fontSize, selektor. Om TypeScript klagar \uc0\u8594  fixa typfelet, \'e4ndra inte v\'e4rdet. Diff efter varje edit.\
\pard\pardeftab720\sa298\partightenfactor0

\f0\b\fs36 \cf0 9. VARF\'d6R SPEC, INTE DIREKT-EDIT\
\pard\pardeftab720\sa240\partightenfactor0

\f1\b0\fs24 \cf0 ~10 nya filer, kr\'e4ver test-iteration, Vercel env-config. Passar Code.\
}