// Seleziona la cella 1,3 della tabella per il grafico altitudini
const chartContainer = d3.select("#cella-1-3")
  .append("div")
  .attr("id", "altitudeContainer")
  .style("display", "none")
  .style("width", "100%")
  .style("height", "100%")
  .style("max-width", "600px")
  .style("display", "flex")
  .style("flex-direction", "column")
  .style("align-items", "center")
  .style("justify-content", "center");

const margin = { top: 60, right: 40, bottom: 95, left: 90 },
      width = 500 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

// Append SVG
const svg = chartContainer.append("svg")
  .attr("id", "altitudeChart")
  .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
  .attr("preserveAspectRatio", "xMidYMid meet")
  .style("width", "100%")
  .style("height", "auto")
  .style("margin-bottom", "16px")
  .style("display", "none") // inizialmente nascosto
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Slider container dentro altitudeContainer
const sliderContainer = d3.select("#altitudeContainer")
  .append("div")
  .attr("id", "sliderContainer")
  .style("height", "auto")
  .style("display", "none")
  .style("margin-top", "12px")
  .style("align-self", "center");

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "#ffffff")
  .style("border", "1px solid #ccc")
  .style("padding", "8px")
  .style("border-radius", "4px")
  .style("pointer-events", "none")
  .style("font-size", "14px")
  .style("box-shadow", "0 0 5px rgba(0,0,0,0.2)")
  .style("display", "none");

function updateAltitudeChart(data, maxAltitude) {
  svg.selectAll("*").remove();

  const bins = [0, 1000, 1250, 1500, 1750, 2000, 2500, 3000];
  const filtered = data.filter(d => +d.HighestPoint && +d.TotalSlope && +d.HighestPoint <= maxAltitude);

  const grouped = d3.rollups(
    filtered,
    v => ({
      totalSlope: d3.sum(v, d => +d.TotalSlope),
      count: v.length,
      resorts: v.map(d => d.Resort)
    }),
    d => {
      const alt = +d.HighestPoint;
      for (let i = 0; i < bins.length - 1; i++) {
        if (alt >= bins[i] && alt < bins[i + 1]) return `${bins[i]}–${bins[i + 1]}m`;
      }
      return `≥ ${bins[bins.length - 1]}m`;
    }
  );

  const orderedBins = [
    "0–1000m", "1000–1250m", "1250–1500m", "1500–1750m",
    "1750–2000m", "2000–2500m", "2500–3000m", "≥ 3000m"
  ];

  const x = d3.scaleBand()
    .domain(orderedBins.filter(label => grouped.some(d => d[0] === label)))
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(grouped, d => d[1].totalSlope) || 100])
    .nice()
    .range([height, 0]);

  svg.append("g")
    .selectAll("rect")
    .data(grouped)
    .enter()
    .append("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1].totalSlope))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d[1].totalSlope))
    .attr("fill", "#007BFF")
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block")
        .style("left", (event.pageX - 20) + "px")
        .style("top", (event.pageY - 40) + "px")
        .html(`${d[1].count} ski resorts`);
      highlightResorts(d[1].resorts);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("display", "none");
      resetResortColors();
    });

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -60)
    .attr("x", -height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Total sum (in Km) of slopes");

  svg.append("text")
    .attr("x", (width + margin.left + margin.right) / 2 - margin.left) 
    .attr("y", height + 80)
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Altitude Range (m)");

  svg.append("g").call(d3.axisLeft(y));
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .attr("dx", "-0.8em")
    .attr("dy", "0.15em");
}

function drawAltitudeChart(stateCode) {
  const file = `../data/resorts_by_country/coordinates/${stateCode}_with_coordinates.csv`;
  d3.csv(file).then(data => {
    d3.select("#spiderContainer").style("display", "none");
    d3.select("#altitudeChart").style("display", "block");
    d3.select("#altitudeContainer").style("display", "flex");
    d3.select("#sliderContainer").style("display", "flex");

    const maxAltitudeFound = d3.max(data, d => +d.HighestPoint || 0);
    const roundedMax = Math.ceil(maxAltitudeFound / 250) * 250;

    d3.select("#sliderContainer").selectAll("*").remove();
    d3.select("#pisteContainer").style("display", "block");

    const slider = d3.select("#sliderContainer").append("input")
      .attr("type", "range")
      .attr("min", 1000)
      .attr("max", roundedMax)
      .attr("step", 250)
      .attr("value", roundedMax)
      .style("width", "250px")
      .style("align-self", "center");

    const sliderLabel = d3.select("#sliderContainer").append("div")
      .attr("id", "sliderLabel")
      .style("margin-top", "4px")
      .style("text-align", "center")
      .style("width", "100%")
      .style("font-size", "13px")
      .text(`Max Altitude: ${roundedMax}m`);

    updateAltitudeChart(data, roundedMax);
    if (typeof updatePisteChart === "function") {
      updatePisteChart(data, roundedMax);
    }

    slider.on("input", function () {
      const val = +this.value;
      sliderLabel.text(`Max Altitude: ${val}m`);
      updateAltitudeChart(data, val);
      if (typeof updatePisteChart === "function") {
        updatePisteChart(data, val);
      }
    });
  });
}

function hideAltitudeChart() {
  d3.select("#altitudeChart").style("display", "none");
  d3.select("#sliderContainer").style("display", "none");
  d3.select("#pisteContainer").style("display", "none");
  d3.select("#prezzoContainer").style("display", "none");
  d3.select("#spiderContainer").style("display", "block");
}