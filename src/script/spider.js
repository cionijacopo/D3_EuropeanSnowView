// spider.js

// Dimensioni e margini per il radar chart
const radarWidth = 400;
const radarHeight = 400;
const radarRadius = Math.min(radarWidth, radarHeight) / 2 - 40;

// Crea il contenitore per il radar chart dentro #grafico
const radarContainer = d3.select("#grafico")
  .append("div")
  .attr("id", "spiderContainer")
  .style("display", "block")
  .style("flex-direction", "column")
  .style("align-items", "center");

// Titolo sopra il grafico
radarContainer.append("div")
  .attr("class", "itemTitle")
  .style("text-align", "center")
  .style("margin-bottom", "10px")
  .text("Main Avg Features");

// switch per mostrare/nascondere i valori reali non normalizzati
const toggleContainer = radarContainer.append("div").attr("class", "toggle-container");
toggleContainer.html(
  '<label class="switch">' +
    '<input type="checkbox" id="showTooltip">' +
    '<span class="slider"></span>' +
  '</label>' +
  '<span class="toggle-label">Show non-normalized values</span>'
);

// Crea l'SVG in cui disegnare il radar chart
const radarSvg = radarContainer
  .append("svg")
  .attr("id", "spiderArea")
  .attr("width", radarWidth)
  .attr("height", radarHeight)
  .append("g")
  .attr("transform", "translate(" + (radarWidth / 2) + ", " + (radarHeight / 2) + ")");

// Variabili globali per dati e scala
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

// Etichette leggibili per i tooltip/assi
const readableLabels = {
  Avg_Total_Slopes: "N. Slopes",
  Avg_Total_Lifts: "N. Lifts",
  Avg_Highest_Point: "Highest Point",
  Avg_Snow_Cannons: "N. Cannons",
  Avg_Day_Pass_Price: "Day Price"
};

// Caricamento del CSV con i dati medi per stato
d3.csv("data/media_per_country.csv", d3.autoType).then(function(data) {
  radarData = data;

  // Scale normalizzate per ogni variabile
  axisLabels.forEach(function(d) {
    radarScales[d] = d3.scaleLinear()
      .domain([0, d3.max(data, function(r) { return r[d]; })])
      .range([0, radarRadius]);
  });

  // Griglia circolare (5 livelli)
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

  // Etichette normalizzate (0.2, 0.4, ...) sul terzo asse (indice 2)
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

  // Assi radiali ed etichette
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

// Toggle mostra/nascondi valori non normalizzati
d3.select("#showTooltip").on("change", function () {
  showRadarTooltip = this.checked;
  radarSvg.selectAll(".axisValue, .axisValuePinned, .axisValueHover, .axisValueBg").remove();
  updateSpider({ pinned: pinnedCountryCode, hover: currentCountryCode });
});

/*
 * Funzione principale per aggiornare il radar chart.
 * Accetta:
 *  - stringa/null (legacy): interpretata come hover
 *  - oggetto { pinned, hover }
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

  // Pulizia disegno (serie, punti, tooltip, etichette)
  radarSvg.selectAll(
    ".radarArea, .radarAreaPinned, .radarAreaHover," +
    " .radarPoint, .radarPointPinned, .radarPointHover," +
    " .radarTooltip, .axisValue, .axisValuePinned, .axisValueHover, .axisValueBg"
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

  // Disegno serie pinned + hover
  var pinnedEntry = drawSeries(pinned, { area: "radarArea radarAreaPinned", point: "radarPoint radarPointPinned" }, "steelblue");
  var hoverEntry  = drawSeries(hover,  { area: "radarArea radarAreaHover",  point: "radarPoint radarPointHover"  }, "#ff7f0e");

  // Helper: testo con “badge” di sfondo per leggibilità
  function addLabelWithBg(cls, x, y, text, anchor, color) {
    var g = radarSvg.append("g").attr("class", "axisValueGroup");
    var t = g.append("text")
      .attr("class", cls + " axisValue")
      .attr("x", x).attr("y", y)
      .attr("text-anchor", anchor || "middle")
      .attr("font-size", "12px")
      .style("font-weight", 600)
      .style("fill", color || "#333")
      .text(text);
    try {
      var bb = t.node().getBBox();
      g.insert("rect", "text")
        .attr("class", "axisValueBg")
        .attr("x", bb.x - 3).attr("y", bb.y - 1)
        .attr("width", bb.width + 6).attr("height", bb.height + 2)
        .attr("rx", 3).attr("ry", 3)
        .attr("fill", "white").attr("opacity", 0.85);
    } catch(e) {}
  }

  // Etichette non normalizzate (solo se toggle attivo)
  if (showRadarTooltip) {
    var numAxes2 = axisLabels.length;
    var angleSlice2 = (Math.PI * 2) / numAxes2;

    // Pinned: raggio 1.22×, testo centrato
    if (pinnedEntry) {
      axisLabels.forEach(function(key, i) {
        var angle = angleSlice2 * i - Math.PI / 2;
        var rLabel = radarRadius * 1.22;
        var x = rLabel * Math.cos(angle);
        var y = rLabel * Math.sin(angle) + 18;
        var value = pinnedEntry[key] || 0;
        addLabelWithBg("axisValuePinned", x, y, Number(value).toFixed(2), "middle", "steelblue");
      });
    }
    // Solo hover (nessun pinned): raggio 1.22×, testo centrato
    else if (hoverEntry) {
      axisLabels.forEach(function(key, i) {
        var angle = angleSlice2 * i - Math.PI / 2;
        var rLabel = radarRadius * 1.22;
        var x = rLabel * Math.cos(angle);
        var y = rLabel * Math.sin(angle) + 18;
        var value = hoverEntry[key] || 0;
        addLabelWithBg("", x, y, Number(value).toFixed(2), "middle", "#333");
      });
    }

    // Confronto pinned + hover: hover su raggio 1.36× e ancoraggio dinamico
    if (pinnedEntry && hoverEntry) {
      axisLabels.forEach(function(key, i) {
        var angle = angleSlice2 * i - Math.PI / 2;
        var rLabel = radarRadius * 1.36;
        var x = rLabel * Math.cos(angle);
        var y = rLabel * Math.sin(angle) + 18;
        var anchor = (Math.cos(angle) >= 0) ? "start" : "end";
        var value = hoverEntry[key] || 0;
        addLabelWithBg("axisValueHover", x, y, Number(value).toFixed(2), anchor, "#ff7f0e");
      });
    }
  }
}
