
// spider.js — Radar + pannello valori (bordi visibili, colori coerenti con le aree)

// Dimensioni del radar
const radarWidth = 400;
const radarHeight = 400;
const radarRadius = Math.min(radarWidth, radarHeight) / 2 - 40;

// Crea contenitore
const radarContainer = d3.select("#grafico")
  .append("div")
  .attr("id", "spiderContainer")
  .style("display", "block")
  .style("flex-direction", "column")
  .style("align-items", "center");

// Titolo
radarContainer.append("div")
  .attr("class", "itemTitle")
  .style("text-align", "center")
  .style("margin-bottom", "10px")
  .text("Main Avg Features");

// Toggle mostra valori reali (non normalizzati)
const toggleContainer = radarContainer.append("div").attr("class", "toggle-container");
toggleContainer.html(
  '<label class="switch">' +
    '<input type="checkbox" id="showTooltip">' +
    '<span class="slider"></span>' +
  '</label>' +
  '<span class="toggle-label">Show non-normalized values</span>'
);

// SVG radar
const radarSvg = radarContainer
  .append("svg")
  .attr("id", "spiderArea")
  .attr("width", radarWidth)
  .attr("height", radarHeight)
  .append("g")
  .attr("transform", "translate(" + (radarWidth / 2) + ", " + (radarHeight / 2) + ")");

// Pannello valori (tabella)
const valuesPanel = radarContainer
  .append("div")
  .attr("id", "spiderValuesPanel")
  .style("display", "none")
  .style("max-width", "600px")
  .style("width", "96%")
  .style("margin-top", "16px");

// Stili minimi per la tabella (iniettati una sola volta)
(function ensurePanelStyles(){
  if (document.getElementById("spiderValuesStyles")) return;
  const css = [
    "#spiderValuesPanel table{width:100%;border-collapse:collapse;font-size:13px;border:1.5px solid #94a3b8;}",

    "#spiderValuesPanel thead th{font-weight:700;text-align:left;padding:8px 10px;border:1.5px solid #94a3b8;}",
    "#spiderValuesPanel thead th.feature{width:45%;background:#f8fafc;}",

    "#spiderValuesPanel thead th.pinned{background:#e8f1fb;color:#1f4f82;}",
    "#spiderValuesPanel thead th.hover{background:#fff2e6;color:#8a4500;}",

    "#spiderValuesPanel tbody td{padding:8px 10px;border:1px solid #cbd5e1;}",

    "#spiderValuesPanel tbody tr:nth-child(odd) td{background:#fbfdff;}",

    "#spiderValuesPanel .col-head{display:flex;align-items:center;gap:6px;}",
    "#spiderValuesPanel .dot{display:inline-block;width:10px;height:10px;border-radius:50%;}",
    "#spiderValuesPanel .dot-blue{background:steelblue;}",
    "#spiderValuesPanel .dot-orange{background:#ff7f0e;}",
    "#spiderValuesPanel .muted{color:#475569;font-weight:600;}"
  ].join('\\n');
  const style = document.createElement("style");
  style.id = "spiderValuesStyles";
  style.textContent = css;
  document.head.appendChild(style);
})();

// Variabili globali
let radarData = [];
let radarScales = {};
let axisLabels = [
  "Avg_Total_Slopes",
  "Avg_Total_Lifts",
  "Avg_Highest_Point",
  "Avg_Snow_Cannons",
  "Avg_Day_Pass_Price"
];
let showRadarTooltip = false;
let currentCountryCode = null;
let pinnedCountryCode = null; // ISO2

const readableLabels = {
  Avg_Total_Slopes: "N. Slopes",
  Avg_Total_Lifts: "N. Lifts",
  Avg_Highest_Point: "Highest Point",
  Avg_Snow_Cannons: "N. Cannons",
  Avg_Day_Pass_Price: "Day Price"
};

// Caricamento dati
d3.csv("data/media_per_country.csv", d3.autoType).then(function(data) {
  radarData = data;

  // Scale normalizzate
  axisLabels.forEach(function(d) {
    radarScales[d] = d3.scaleLinear()
      .domain([0, d3.max(data, function(r) { return r[d]; })])
      .range([0, radarRadius]);
  });

  // Griglia (5 livelli)
  var levels = 5;
  var gridGroup = radarSvg.append("g").attr("class", "radarGrid");
  for (var lvl = 1; lvl <= levels; lvl++) {
    var r = (radarRadius / levels) * lvl;
    gridGroup.append("circle")
      .attr("cx", 0).attr("cy", 0).attr("r", r)
      .style("fill", "none")
      .style("stroke", "#ccc")
      .style("stroke-dasharray", "2,2")
      .style("stroke-width", 0.5);
  }

  // Etichette normalizzate (0.2, 0.4, ...) sul terzo asse
  var labelAngle = (Math.PI * 2 / axisLabels.length) * 2 - Math.PI / 2;
  for (var lvl2 = 1; lvl2 <= levels; lvl2++) {
    var rr = (radarRadius / levels) * lvl2;
    var labelX = rr * Math.cos(labelAngle);
    var labelY = rr * Math.sin(labelAngle);
    gridGroup.append("text")
      .attr("x", labelX + 5)
      .attr("y", labelY + 4)
      .attr("font-size", "10px")
      .style("fill", "#666")
      .text((rr / radarRadius).toFixed(1));
  }

  // Assi radiali + nomi
  var numAxes = axisLabels.length;
  var angleSlice = (Math.PI * 2) / numAxes;
  var axisGroup = radarSvg.append("g").attr("class", "axes");

  axisLabels.forEach(function(label, i) {
    var angle = angleSlice * i - Math.PI / 2;
    var x = radarRadius * Math.cos(angle);
    var y = radarRadius * Math.sin(angle);

    axisGroup.append("line")
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", x).attr("y2", y)
      .attr("stroke", "#aaa").attr("stroke-width", 1);

    axisGroup.append("text")
      .attr("x", x * 1.15)
      .attr("y", y * 1.17)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .style("text-anchor", "middle")
      .text(readableLabels[label]);
  });
});

// Toggle pannello valori
d3.select("#showTooltip").on("change", function () {
  showRadarTooltip = this.checked;
  valuesPanel.style("display", (showRadarTooltip ? "block" : "none"));
  updateSpider({ pinned: pinnedCountryCode, hover: currentCountryCode });
});

// Helpers
function countryNameFor(code) {
  if (!code) return "";
  var rec = radarData.find(function(d){ return d.country_code === code; });
  if (!rec) return code;
  return rec.country || rec.country_name || code;
}
function fmt(v){ return (v == null ? "" : Number(v).toFixed(2)); }

/**
 * Aggiorna il radar chart.
 * input: string/null (hover) oppure { pinned, hover }
 */
function updateSpider(input) {
  // Normalizza argomenti
  var pinned = null, hover = null;
  if (typeof input === "string" || input == null) {
    hover = input || null;
  } else {
    pinned = (input && input.pinned) ? input.pinned : null;
    hover  = (input && input.hover)  ? input.hover  : null;
  }
  if (typeof pinned !== "undefined") pinnedCountryCode = pinned;
  currentCountryCode = hover;

  // Pulizia delle serie
  radarSvg.selectAll(
    ".radarArea, .radarAreaPinned, .radarAreaHover," +
    " .radarPoint, .radarPointPinned, .radarPointHover," +
    " .radarTooltip"
  ).remove();

  function entryFor(code) {
    if (!code) return null;
    var e = radarData.find(function(d){ return d.country_code === code; });
    return e || null;
  }

  function drawSeries(code, classes, color) {
    var entry = entryFor(code);
    if (!entry) return null;

    var numAxes = axisLabels.length;
    var angleSlice = (Math.PI * 2) / numAxes;

    // poligono
    var points = axisLabels.map(function(key, i) {
      var value = entry[key];
      var radius = radarScales[key](value);
      var angle = angleSlice * i - Math.PI / 2;
      return [radius * Math.cos(angle), radius * Math.sin(angle)];
    });
    points.push(points[0]);

    radarSvg.append("path")
      .datum(points)
      .attr("class", classes.area)
      .attr("fill", color)
      .attr("fill-opacity", (classes.area.indexOf("Hover") >= 0) ? 0.25 : 0.5)
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("d", d3.line()(points));

    // punti
    axisLabels.forEach(function(key, i) {
      var value = entry[key];
      var angle = (Math.PI * 2 / axisLabels.length) * i - Math.PI / 2;
      var radius = radarScales[key](value);
      var x = radius * Math.cos(angle);
      var y = radius * Math.sin(angle);

      radarSvg.append("circle")
        .attr("class", classes.point)
        .attr("cx", x).attr("cy", y).attr("r", 4)
        .attr("fill", color)
        .on("mouseover", function () {
          d3.select(this).transition().duration(150).attr("r", 6);
          radarSvg.append("text")
            .attr("class", "radarTooltip")
            .attr("x", x).attr("y", y - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "11px").style("font-weight", "bold")
            .text(Number(value).toFixed(1));
        })
        .on("mouseout", function () {
          d3.select(this).transition().duration(150).attr("r", 4);
          radarSvg.selectAll(".radarTooltip").remove();
        });
    });

    return entry;
  }

  // Disegna serie pinned + hover
  var pinnedEntry = drawSeries(pinned, { area: "radarArea radarAreaPinned", point: "radarPoint radarPointPinned" }, "steelblue");
  var hoverEntry  = drawSeries(hover,  { area: "radarArea radarAreaHover",  point: "radarPoint radarPointHover"  }, "#ff7f0e");

  // Aggiorna pannello valori (sempre visibile se il toggle è attivo)
  updateValuesPanel(pinnedEntry, hoverEntry);
}

// Costruisce/aggiorna la tabellina sotto il grafico
function updateValuesPanel(pinnedEntry, hoverEntry) {
  if (!showRadarTooltip) {
    valuesPanel.style("display", "none").html("");
    return;
  }
  valuesPanel.style("display", "block");

  // Header: sempre tre colonne (Feature, Pinned, Hover)
  var pinnedTitle = pinnedEntry ? (countryNameFor(pinnedEntry.country_code) || "Pinned") : "Pinned";
  var hoverTitle  = hoverEntry  ? (countryNameFor(hoverEntry.country_code)  || "Hover")  : "Hover";

  var html = "";
  html += '<table class="spider-table">';
  html +=   '<thead><tr>';
  html +=     '<th class="feature muted">Feature</th>';
  html +=     '<th class="pinned"><span class="col-head"><span class="dot dot-blue"></span> ' + pinnedTitle + '</span></th>';
  html +=     '<th class="hover"><span class="col-head"><span class="dot dot-orange"></span> ' + hoverTitle + '</span></th>';
  html +=   '</tr></thead>';
  html +=   '<tbody>';

  axisLabels.forEach(function(key){
    var label = readableLabels[key] || key;
    var pVal = pinnedEntry ? fmt(pinnedEntry[key]) : "";
    var hVal = hoverEntry  ? fmt(hoverEntry[key])  : "";
    html += '<tr>';
    html +=   '<td>' + label + '</td>';
    // inline color to guarantee even if external CSS overrides
    html +=   '<td class="td-pinned" style="color: steelblue; font-weight: 600;">' + pVal + '</td>';
    html +=   '<td class="td-hover"  style="color: #ff7f0e; font-weight: 600;">' + hVal + '</td>';
    html += '</tr>';
  });

  html +=   '</tbody>';
  html += '</table>';

  valuesPanel.html(html);
}
