const prezzoContainer = d3.select("#cella-2-1")
    .append("div")
    .attr("id", "prezzoContainer")
    .style("display", "none")
    .style("margin-top", "10px")
    .style("width", "100%")
    .style("height", "100%")
    .style("text-align", "center");

const marginPrezzo = { top: 30, right: 30, bottom: 50, left: 60 },
      widthPrezzo = 500 - marginPrezzo.left - marginPrezzo.right,
      heightPrezzo = 300 - marginPrezzo.top - marginPrezzo.bottom;

const innerWrapperPrezzo = prezzoContainer.append("div")
    .attr("id", "prezzoInnerWrapper")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("align-items", "center")
    .style("justify-content", "center")
    .style("height", "100%");

const svgPrezzo = innerWrapperPrezzo.append("svg")
    .attr("viewBox", `0 0 ${widthPrezzo + marginPrezzo.left + marginPrezzo.right} ${heightPrezzo + marginPrezzo.top + marginPrezzo.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto")
    .append("g")
    .attr("transform", `translate(${marginPrezzo.left}, ${marginPrezzo.top})`);

const europeanAvg = 33.8; // media europea calcolata da media_per_country.csv

function updatePrezzoChart(data) {
    svgPrezzo.selectAll("*").remove();

    const prices = data.map(d => +d.DayPassPriceAdult).filter(d => !isNaN(d));
    if (prices.length === 0) {
        prezzoContainer.style("display", "none");
        return;
    }

    const mean = d3.mean(prices);
    const deviation = d3.deviation(prices);

    const maxPrice = d3.max(prices);
    const x = d3.scaleLinear()
        .domain([0, maxPrice * 1.05])
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

    svgPrezzo.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", d => x(d.x0) + 1)
        .attr("y", d => y(d.length))
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("height", d => heightPrezzo - y(d.length))
        .style("fill", "steelblue")
        .on("mouseover", (event, d) => {
            const matched = data.filter(e => +e.DayPassPriceAdult >= d.x0 && +e.DayPassPriceAdult < d.x1).map(e => e.Resort);
            highlightResorts(matched);
        })
        .on("mouseout", () => {
            resetResortColors();
        });

    if (mean && deviation) {
        const line = d3.line()
            .x(d => x(d.x))
            .y(d => y(d.y));

        const curveData = d3.range(x.domain()[0], x.domain()[1], 0.1).map(xVal => ({
            x: xVal,
            y: (1 / (deviation * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((xVal - mean) / deviation, 2)) * prices.length * (bins[0].x1 - bins[0].x0)
        }));

        svgPrezzo.append("path")
            .datum(curveData)
            .attr("fill", "none")
            .attr("stroke", "#ff7f00")
            .attr("stroke-width", 2)
            .attr("d", line);
    }

    svgPrezzo.append("line")
        .attr("x1", x(mean))
        .attr("x2", x(mean))
        .attr("y1", 0)
        .attr("y2", heightPrezzo)
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4");

    svgPrezzo.append("line")
        .attr("x1", x(europeanAvg))
        .attr("x2", x(europeanAvg))
        .attr("y1", 0)
        .attr("y2", heightPrezzo)
        .attr("stroke", "#c412c4")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4");

    svgPrezzo.append("g")
        .attr("transform", `translate(0, ${heightPrezzo})`)
        .call(d3.axisBottom(x).tickFormat(d => `€${d}`));

    svgPrezzo.append("g")
        .call(d3.axisLeft(y));

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

    const legend = svgPrezzo.append("g")
        .attr("transform", `translate(10, 10)`);

    const legendData = [
        { label: "Country Avg", color: "red", dash: "4,4" },
        { label: "European Avg", color: "#c412c4", dash: "4,4" },
        { label: "Gaussian Curve", color: "#ff7f00", dash: null }
    ];

    legend.selectAll("line")
        .data(legendData)
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", 20)
        .attr("y1", (d, i) => i * 20)
        .attr("y2", (d, i) => i * 20)
        .attr("stroke", d => d.color)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", d => d.dash || "none");

    legend.selectAll("text")
        .data(legendData)
        .enter()
        .append("text")
        .attr("x", 25)
        .attr("y", (d, i) => i * 20 + 5)
        .style("font-size", "12px")
        .text(d => d.label);

    prezzoContainer.style("display", "block");
}
