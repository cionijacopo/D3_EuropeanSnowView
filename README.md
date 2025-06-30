# ❄️ European Snow View (Scientific and Large Data Visualization Project - A.A. 2024-2025)

**European Snow View** è un progetto interattivo basato su **D3.js** che visualizza i resort sciistici europei. Consente di esplorare dati per stato tramite una mappa interattiva e diversi grafici dinamici.

## 📁 Struttura del progetto (semplificata)

```
📁 D3_EuropeanSnowView/
├── 📄 index.html                 # Pagina principale del progetto
├── 📁 src/
│   ├── 📄 index.css              # Stili globali e layout
│   ├── 📄 spider.css             # Stili dello spiderplot
│   ├── 📄 mappa.js               # Gestione mappa e interazioni
│   ├── 📄 spider.js              # Creazione radar chart
│   ├── 📄 grafico_altezza.js     # Grafico altitudine con slider
│   ├── 📄 grafico_piste.js       # Scatterplot difficoltà vs altitudine
│   ├── 📄 grafico_prezzi.js      # Istogramma prezzi skipass
│   ├── 📄 grafico_impianti.js    # Curve gaussiane per impianti di risalita
│   ├── 📄 figure.js              # Icone e tooltip feature dei resort
│   └── 📁 data/
│       ├── 📄 media_per_country.csv
│       └── 📁 resorts_by_country/
│           └── 📁 coordinates/
│               ├── 📄 AT_with_coordinates.csv
│               ├── 📄 FR_with_coordinates.csv
│               ├── 📄 IT_with_coordinates.csv
│               └── ... (altri file CSV per paese)
```

## 🌍 Funzionalità

### ✅ Vista Europa (iniziale)
- Mappa interattiva con radar chart (spiderplot) comparativo per ogni stato
- Hover su un paese: aggiornamento del radar chart
- Click su un paese: zoom con analisi dettagliata

### 🔍 Vista Stato (dettaglio)
- Layout tabellare 2x3 con:
  - 📊 **Altitudine**: istogramma piste per fascia di quota (con slider)
  - 💶 **Prezzi**: istogramma con curva gaussiana, media paese/europea
  - 🟢🔴 **Difficoltà**: scatterplot altitudine vs difficoltà media
  - 🚠 **Impianti**: curve gaussiane per tipi di impianto (draglift, seggiovie, cabinovie)
  - 🧊 **Feature Iconiche**: presenza snowpark, cannoni, sci notturno, ecc.

## 🛠️ Tecnologie

- [D3.js v7](https://d3js.org/)
- HTML5 / CSS3 / JavaScript
- Responsive layout 

## ⚙️ Avvio & Tests

Link: https://cionijacopo.github.io/D3_EuropeanSnowView/