const pisteContainer = d3.select("#grafico")
  .append("div")
  .attr("id", "pisteContainer")
  .style("display", "none")
  .style("margin-top", "30px");

const marginPiste = { top: 30, right: 30, bottom: 50, left: 150 },
      widthPiste = 500 - marginPiste.left - marginPiste.right,
      heightPiste = 400 - marginPiste.top - marginPiste.bottom;

const svgPiste = pisteContainer.append("svg")
  .attr("id", "pisteChart")
  .attr("width", widthPiste + marginPiste.left + marginPiste.right)
  .attr("height", heightPiste + marginPiste.top + marginPiste.bottom + 50)
  .append("g")
  .attr("transform", `translate(${marginPiste.left},${marginPiste.top})`);

pisteContainer.style("display", "none");

function updatePisteChart(data, maxAltitude) {
    svgPiste.selectAll("*").remove();

    const bins = [0, 1000, 1250, 1500, 1750, 2000, 2500, 3000];

    const filtered = data.filter(d =>
        +d.HighestPoint <= maxAltitude &&
        !isNaN(+d.BeginnerSlope) &&
        !isNaN(+d.IntermediateSlope) &&
        !isNaN(+d.DifficultSlope)
    );

    const grouped = d3.rollups(
        filtered,
        v => ({
        beginner: d3.sum(v, d => +d.BeginnerSlope),
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

    const categories = ["beginner", "intermediate", "difficult"];
    const colors = {
        beginner: "#519a77",
        intermediate: "#ec8609",
        difficult: "#a72707"
    };

    const x = d3.scaleLinear()
        .domain([0, d3.max(grouped, d => Math.max(
        d[1].beginner,
        d[1].intermediate,
        d[1].difficult
        )) || 100])
        .nice()
        .range([0, widthPiste]);

    const y0 = d3.scaleBand()
        .domain(orderedBins.filter(label => grouped.some(d => d[0] === label)))
        .range([0, heightPiste])
        .padding(0.2);

    const y1 = d3.scaleBand()
        .domain(categories)
        .range([0, y0.bandwidth()])
        .padding(0.05);

    svgPiste.selectAll("g")
        .data(grouped)
        .enter()
        .append("g")
        .attr("transform", d => `translate(0, ${y0(d[0])})`)
        .selectAll("rect")
        .data(d => categories.map(key => ({ key, value: d[1][key] })))
        .enter()
        .append("rect")
        .attr("y", d => y1(d.key))
        .attr("height", y1.bandwidth())
        .attr("x", 0)
        .attr("width", d => x(d.value))
        .attr("fill", d => colors[d.key]);

    svgPiste.append("g").call(d3.axisLeft(y0));
    svgPiste.append("g")
        .attr("transform", `translate(0, ${heightPiste})`)
        .call(
            d3.axisBottom(x)
            .ticks(6)                        // massimo 6 tick
            .tickFormat(d3.format(",.0f"))  // formatta come "1,000" senza decimali
        )
        .selectAll("text")
        .style("font-size", "12px"); 

    // Etichetta asse X
    svgPiste.append("text")
        .attr("x", widthPiste / 2)
        .attr("y", heightPiste + 40)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Total sum (in Km) of Slopes by Difficulty");

    // ✅ Legenda
    const legend = svgPiste.append("g")
        .attr("transform", `translate(${widthPiste / 2 - 180}, ${heightPiste + 60})`);


    const legendItems = ["beginner", "intermediate", "difficult"];

    legend.selectAll("rect")
        .data(legendItems)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * 120)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => colors[d]);

    legend.selectAll("text")
        .data(legendItems)
        .enter()
        .append("text")
        .attr("x", (d, i) => i * 120 + 24)
        .attr("y", 14)
        .style("font-size", "12px")
        .text(d => d.charAt(0).toUpperCase() + d.slice(1));
}
