# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Audio and haptics

The campaign includes synthesized ambient music and a territory-capture sound effect. Use the Music and Effects controls in the campaign header to toggle them. On supported mobile browsers, a vibration pulse plays when the player captures a territory; Haptics can also be toggled there.

The game uses a single dark, glassmorphism command-center theme over the supplied battlefield artwork. The landing page includes a quick setup briefing and a guide to choosing a nation, reinforcing, attacking, and winning. The gear menu provides persistent music and sound-effects volume sliders. Spectator mode shows the live campaign map, territory and troop standings, AI commentary, and battle log together.

Campaign setup offers ten playable African countries: Algeria, DR Congo, Egypt, Ethiopia, Ghana, Kenya, Morocco, Nigeria, South Africa, and Tanzania. Other continents remain visible as read-only map previews. Each campaign contains the chosen African country and the other nine countries as AI opponents. The interactive map supports drag-to-pan and wheel/pinch zoom. The active campaign dashboard uses satellite basemap tiles from Esri World Imagery, with attribution displayed on the map; an internet connection is required to load the imagery. World country metadata and simplified boundaries are derived from [world-countries](https://github.com/mledoze/countries), licensed under ODbL-1.0; see the package's license for attribution and share-alike terms.

Starting garrisons use the case-study population bands (1–9 soldiers) with campaign population estimates rounded to millions, based on [Worldometer's country population data](https://www.worldometers.info/world-population/population-by-country/). During combat, both sides roll one die for each soldier they can commit; the attacker must retain one soldier in its territory. Dice are paired in roll order, and ties cause no loss. On later-round turns, players and NPCs receive two reinforcements per controlled country. Players can allocate their reinforcements and transfer troops between controlled countries while leaving at least one soldier behind.

Choosing a fight opens a full-screen tactical arena with animated 3D soldier formations, troop-strength panels, battle logs, and custom 3D dice. The dice appear under each side's troop count; rolling is silent. Each deliberate dice roll resolves one combat round; the displayed win probabilities are estimates based on the current troop counts.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
