# Graph Report - .  (2026-09-12)

## Corpus Check
- Corpus is ~16,217 words - fits in a single context window. You may not need a graph.

## Summary
- 57 nodes · 11 edges · 49 communities (2 shown, 47 thin omitted)
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Arena Tracking & Assets
- Documentation & Config
- Product & Element Picker
- Api Db Wake Triggerrestore
- Src Components Appshell Appshe
- Src Components Footer Footer
- Src Components Logo Logo
- Src Components Statusbadge Sta
- Src Components Ui Badge Badge
- Src Components Ui Button Butto
- Src Components Ui Card Card
- Src Components Ui Card Cardcon
- Src Components Ui Card Carddes
- Src Components Ui Card Cardfoo
- Src Components Ui Card Cardhea
- Src Components Ui Card Cardtit
- Src Components Ui Dialog Dialo
- Src Components Ui Dialog Dialo
- Src Components Ui Dialog Dialo
- Src Components Ui Dialog Dialo
- Src Components Ui Separator Se
- Src Components Ui Table Table
- Src Components Ui Table Tableb
- Src Components Ui Table Tablec
- Src Components Ui Table Tableh
- Src Components Ui Table Tableh
- Src Components Ui Table Tabler
- Src Context Projectscontext Pr
- Src Context Projectscontext Us
- Src Lib Audit Runpreintakeaudi
- Src Lib Certificate Buildcerti
- Src Lib Certificate Downloadce
- Src Lib Types Auditverdict
- Src Lib Types Fixitem
- Src Lib Types Fixkey
- Src Lib Types Fixprogress
- Src Lib Types Fixstatus
- Src Lib Types Intakeformdata
- Src Lib Types Patchlogentry
- Src Lib Types Project
- Src Lib Types Projectstatus
- Src Lib Types Whitelabelsettin
- Src Lib Utils Cn
- Src Lib Utils Formatcurrency
- Src Lib Utils Formatdate
- Src Lib Utils Formatdatetime
- Src Lib Utils Timeago
- Src Lib Utils Uid
- Src Pages Notfound Notfound

## God Nodes (most connected - your core abstractions)
1. `Livecheck App Entry HTML` - 7 edges
2. `React + TypeScript + Vite Template Documentation` - 2 edges
3. `Livecheck Product Description` - 2 edges
4. `Arena Session Recording` - 2 edges
5. `Arena Page Views Tracking` - 2 edges
6. `Arena Element Picker` - 2 edges
7. `React Compiler` - 1 edges
8. `ESLint Configuration` - 1 edges
9. `Livecheck Favicon` - 1 edges
10. `Vite Logo` - 1 edges

## Surprising Connections (you probably didn't know these)
- `Livecheck App Entry HTML` --references--> `Vite Logo`  [INFERRED]
  index.html → public/vite.svg
- `Livecheck App Entry HTML` --references--> `React Logo`  [INFERRED]
  index.html → src/assets/react.svg
- `Livecheck App Entry HTML` --references--> `Livecheck Favicon`  [EXTRACTED]
  index.html → public/favicon.svg

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Arena Analytics & Recording System** — index_html_arena_recording, index_html_arena_views, index_html_element_picker [INFERRED 0.85]
- **Livecheck Brand Identity** — index_html_livecheck_desc, public_favicon_svg [INFERRED 0.75]

## Communities (49 total, 47 thin omitted)

### Community 0 - "Arena Tracking & Assets"
Cohesion: 0.40
Nodes (6): Livecheck App Entry HTML, Arena Session Recording, Arena Page Views Tracking, Livecheck Favicon, Vite Logo, React Logo

### Community 1 - "Documentation & Config"
Cohesion: 0.67
Nodes (3): React + TypeScript + Vite Template Documentation, ESLint Configuration, React Compiler

## Knowledge Gaps
- **50 isolated node(s):** `triggerRestore`, `AppShell`, `Footer`, `Logo`, `StatusBadge` (+45 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Livecheck App Entry HTML` connect `Arena Tracking & Assets` to `Product & Element Picker`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Livecheck App Entry HTML` (e.g. with `Vite Logo` and `React Logo`) actually correct?**
  _`Livecheck App Entry HTML` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `triggerRestore`, `AppShell`, `Footer` to the rest of the system?**
  _51 weakly-connected nodes found - possible documentation gaps or missing edges._