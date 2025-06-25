// Seleziona la cella 2,1 della tabella
const prezzoContainer = d3.select("#cella-2-1")
    .append("div")
    .attr("id", "prezzoContainer")
    .style("display", "none")
    .style("margin-top", "10px")
    .style("width", "100%")
    .style("text-align", "center");

const marginPrezzo = { top: 30, right: 30, bottom: 50, left: 60 },
      widthPrezzo = 500 - marginPrezzo.left - marginPrezzo.right,
      heightPrezzo = 300 - marginPrezzo.top - marginPrezzo.bottom;

const svgPrezzo = prezzoContainer.append("svg")
    .attr("width", widthPrezzo + marginPrezzo.left + marginPrezzo.right)
    .attr("height", heightPrezzo + marginPrezzo.top + marginPrezzo.bottom)
    .append("g")
    .attr("transform", `translate(${marginPrezzo.left}, ${marginPrezzo.top})`);

function updatePrezzoChart(data) {
    svgPrezzo.selectAll("*").remove();

    const prices = data.map(d => +d.DayPassPriceAdult).filter(d => !isNaN(d));
    if (prices.length === 0) {
        prezzoContainer.style("display", "none");
        return;
    }

    const x = d3.scaleLinear()
        .domain([0, d3.max(prices)])
        .nice()
        .range([0, widthPrezzo]);

    const histogram = d3.bin()
        .domain(x.domain())
        .thresholds(x.ticks(20));

    const bins = histogram(prices);

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .nice()
        .range([heightPrezzo, 0]);

    // Istogramma
    svgPrezzo.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", d => x(d.x0) + 1)
        .attr("y", d => y(d.length))
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("height", d => heightPrezzo - y(d.length))
        .style("fill", "steelblue");

    // Assi
    svgPrezzo.append("g")
        .attr("transform", `translate(0, ${heightPrezzo})`)
        .call(d3.axisBottom(x).tickFormat(d => `€${d}`));

    svgPrezzo.append("g")
        .call(d3.axisLeft(y));

    // Etichette
    svgPrezzo.append("text")
        .attr("x", widthPrezzo / 2)
        .attr("y", heightPrezzo + 40)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Day Pass Price Range (€)");

    svgPrezzo.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -heightPrezzo / 2)
        .attr("y", -40)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Resorts");

    prezzoContainer.style("display", "block");
}
