const chartContainer = d3.select("#grafico")
    .append("div")
    .attr("id", "altitudeContainer")
    .style("display", "none")  // inizialmente nascosto
    .style("flex-direction", "row")
    .style("align-items", "center")
    .style("justify-content", "center");

const margin = { top: 60, right: 40, bottom: 110, left: 90 },
      width = 450 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

// Append SVG
const svg = chartContainer.append("svg")
    .attr("id", "altitudeChart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("display", "none") // inizialmente nascosto
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Slider container
const sliderContainer = chartContainer.append("div")
    .attr("id", "sliderContainer")
    .style("height", "350px")
    .style("display", "none")
    .style("margin-left", "10px")
    .style("align-self", "center");

// Crea input slider verticale
const slider = sliderContainer.append("input")
    .attr("type", "range")
    .attr("min", 1000)
    .attr("max", 3000)
    .attr("step", 250)
    .attr("value", 3000)
    .style("writing-mode", "bt-lr")
    .style("transform", "rotate(270deg)")
    .style("height", "150px");

// Etichetta slider
const sliderLabel = sliderContainer.append("div")
    .attr("id", "sliderLabel")
    .style("margin-top", "10px")
    .style("text-align", "center")
    .style("font-size", "14px")
    .text("Max Altitude: 3000m");

// Funzione principale per aggiornare il grafico
function updateAltitudeChart(data, maxAltitude) {
    svg.selectAll("*").remove();

    const bins = [0, 1000, 1250, 1500, 1750, 2000, 2500, 3000];
    const filtered = data
        .filter(d => +d.HighestPoint && +d.TotalSlope && +d.HighestPoint <= maxAltitude);

    const grouped = d3.rollups(
        filtered,
        v => d3.sum(v, d => +d.TotalSlope),
        d => {
            const alt = +d.HighestPoint;
            for (let i = 0; i < bins.length - 1; i++) {
                if (alt >= bins[i] && alt < bins[i + 1]) return `${bins[i]}–${bins[i + 1]}m`;
            }
            return `≥ ${bins[bins.length - 1]}m`;
        }
    );

    const x = d3.scaleBand()
        .domain(grouped.map(d => d[0]))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(grouped, d => d[1]) || 100])
        .nice()
        .range([height, 0]);

    svg.append("g")
        .selectAll("rect")
        .data(grouped)
        .enter()
        .append("rect")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d[1]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d[1]))
        .attr("fill", "#007BFF");

    // Etichetta asse Y (verticale)
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -60) // distanza dal bordo sinistro
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Total sum (in Km) of slopes");

// Etichetta asse X (orizzontale)
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 70) // distanza sotto l’asse
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Altitude Range (m)");

    svg.append("g").call(d3.axisLeft(y));
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x))
        .selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end").attr("dx", "-0.8em").attr("dy", "0.15em");
}

// Funzione pubblica per mappa.js
function drawAltitudeChart(stateCode) {
    const file = `../data/resorts_by_country/coordinates/${stateCode}_with_coordinates.csv`;

    d3.csv(file).then(data => {
        d3.select("#spiderContainer").style("display", "none");
        d3.select("#altitudeChart").style("display", "block");
        d3.select("#sliderContainer").style("display", "flex");

        const maxAltitude = +slider.node().value;
        updateAltitudeChart(data, maxAltitude);

        slider.on("input", function () {
            const val = +this.value;
            sliderLabel.text(`Max Altitude: ${val}m`);
            updateAltitudeChart(data, val);
        });
    });
}

// Funzione per nascondere
function hideAltitudeChart() {
    // Nascondi il grafico altitudine e slider
    d3.select("#altitudeChart").style("display", "none");
    d3.select("#sliderContainer").style("display", "none");

    // Mostra di nuovo lo spider plot
    d3.select("#spiderContainer").style("display", "block");
}
