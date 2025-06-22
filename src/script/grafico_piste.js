const pisteContainer = d3.select("#grafico")
  .append("div")
  .attr("id", "pisteContainer")
  .style("display", "none")
  .style("margin-top", "30px");

const marginPiste = { top: 30, right: 30, bottom: 50, left: 150 },
      widthPiste = 450 - marginPiste.left - marginPiste.right,
      heightPiste = 400 - marginPiste.top - marginPiste.bottom;

const svgPiste = pisteContainer.append("svg")
  .attr("id", "pisteChart")
  .attr("width", widthPiste + marginPiste.left + marginPiste.right)
  .attr("height", heightPiste + marginPiste.top + marginPiste.bottom)
  .append("g")
  .attr("transform", `translate(${marginPiste.left},${marginPiste.top})`);

pisteContainer.style("display", "none");

function updatePisteChart(data, maxAltitude) {
  svgPiste.selectAll("*").remove();

  const bins = [0, 1000, 1250, 1500, 1750, 2000, 2500, 3000];

  const filtered = data.filter(d => 
    +d.HighestPoint <= maxAltitude &&
    d.EasySlope && d.IntermediateSlope && d.DifficultSlope
  );

  const grouped = d3.rollups(
    filtered,
    v => ({
      easy: d3.sum(v, d => +d.EasySlope),
      intermediate: d3.sum(v, d => +d.IntermediateSlope),
      difficult: d3.sum(v, d => +d.DifficultSlope)
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

  const x = d3.scaleLinear()
    .domain([0, d3.max(grouped, d => d[1].easy + d[1].intermediate + d[1].difficult) || 100])
    .nice()
    .range([0, widthPiste]);

  const y = d3.scaleBand()
    .domain(orderedBins.filter(label => grouped.some(d => d[0] === label)))
    .range([0, heightPiste])
    .padding(0.1);

  // Crea le barre impilate
  svgPiste.selectAll("g.bar")
    .data(grouped)
    .enter()
    .append("g")
    .attr("transform", d => `translate(0,${y(d[0])})`)
    .each(function(d) {
      let xOffset = 0;
      ["easy", "intermediate", "difficult"].forEach(type => {
        const value = d[1][type];
        d3.select(this).append("rect")
          .attr("x", xOffset)
          .attr("width", x(value))
          .attr("height", y.bandwidth())
          .attr("fill", type === "easy" ? "#a1d99b" : type === "intermediate" ? "#fc9272" : "#9e9ac8");

        xOffset += x(value);
      });
    });

  // Assi
  svgPiste.append("g").call(d3.axisLeft(y));
  svgPiste.append("g")
    .attr("transform", `translate(0, ${heightPiste})`)
    .call(d3.axisBottom(x));

  // Etichette
  svgPiste.append("text")
    .attr("x", widthPiste / 2)
    .attr("y", heightPiste + 40)
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Total Slopes by Difficulty (km)");
}
