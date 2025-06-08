// spider.js

// Dimensioni e margini per il radar chart
const radarWidth = 400;
const radarHeight = 400;
const radarRadius = Math.min(radarWidth, radarHeight) / 2 - 40;

// Titolo sopra il grafico
d3.select("#grafico")
  .append("div")
  .attr("class", "itemTitle")
  .style("text-align", "center")
  .style("margin-bottom", "10px")
  .text("Main Features (Avg)");


// Container SVG
const radarSvg = d3.select("#grafico")
  .append("svg")
  .attr("id", "spiderArea")
  .attr("width", radarWidth)
  .attr("height", radarHeight)
  .append("g")
  .attr("transform", `translate(${radarWidth / 2}, ${radarHeight / 2})`);

// Variabili globali per dati e scala
let radarData = [];
let radarScales = {};
let axisLabels = [
  "avg_total_slopes",
  "avg_lifts",
  "avg_max_elevation",
  "avg_snow_cannons",
  "avg_day_pass_price"
];

// Etichette leggibili per i tooltip/assi
const readableLabels = {
  avg_total_slopes: "Piste",
  avg_lifts: "Impianti",
  avg_max_elevation: "Altitudine",
  avg_snow_cannons: "Cannoni",
  avg_day_pass_price: "Prezzo"
};

// Caricamento del CSV con i dati medi per stato
// (assicurati che il file sia nella cartella corretta!)
d3.csv("../data/media_per_country.csv", d3.autoType).then(data => {
  radarData = data;

  // Costruisci le scale normalizzate per ogni variabile
  axisLabels.forEach(d => {
    radarScales[d] = d3.scaleLinear()
      .domain([0, d3.max(data, r => r[d])])
      .range([0, radarRadius]);
  });

// Numero di livelli concentrici
const levels = 5;

// Crea un gruppo per la griglia
const gridGroup = radarSvg.append("g").attr("class", "radarGrid");

// Aggiungi i cerchi concentrici
for (let level = 1; level <= levels; level++) {
    const r = (radarRadius / levels) * level;

gridGroup.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", r)
    .style("fill", "none")
    .style("stroke", "#ccc")
    .style("stroke-dasharray", "2,2")
    .style("stroke-width", 0.5);
}


  // Disegna le assi
  const numAxes = axisLabels.length;
  const angleSlice = (Math.PI * 2) / numAxes;

  const axisGroup = radarSvg.append("g").attr("class", "axes");

  axisLabels.forEach((label, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const x = radarRadius * Math.cos(angle);
    const y = radarRadius * Math.sin(angle);

    axisGroup.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", x)
      .attr("y2", y)
      .attr("stroke", "#aaa")
      .attr("stroke-width", 1);

    axisGroup.append("text")
      .attr("x", x * 1.1)
      .attr("y", y * 1.1)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .style("text-anchor", "middle")
      .text(readableLabels[label]);
  });

  // Disegna inizialmente un grafico vuoto
  updateSpider("FR"); // codice a due lettere ISO (es. "FR" Francia)
});

function updateSpider(countryCode) {
  const entry = radarData.find(d => d.country_code === countryCode);
  if (!entry) return;

  const numAxes = axisLabels.length;
  const angleSlice = (Math.PI * 2) / numAxes;

  const points = axisLabels.map((key, i) => {
    const value = entry[key];
    const radius = radarScales[key](value);
    const angle = angleSlice * i - Math.PI / 2;
    return [
      radius * Math.cos(angle),
      radius * Math.sin(angle)
    ];
  });

  // Chiudi il poligono
  points.push(points[0]);

  // Rimuovi eventuale vecchio radar
  radarSvg.selectAll(".radarArea").remove();

  // Disegna nuovo
  radarSvg.append("path")
    .datum(points)
    .attr("class", "radarArea")
    .attr("fill", "steelblue")
    .attr("fill-opacity", 0.5)
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", d3.line()(points));
}
