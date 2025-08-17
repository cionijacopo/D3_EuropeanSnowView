// Seleziona la cella 2,2 della tabella
const impiantiContainer = d3.select("#cella-2-2")
    .append("div")
    .attr("id", "impiantiContainer")
    .style("display", "none")
    .style("margin-top", "10px")
    .style("width", "100%")
    .style("text-align", "center");

// Wrapper interno per svg + etichetta
const innerWrapper = impiantiContainer.append("div")
    .attr("id", "impiantiInnerWrapper")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("align-items", "center")
    .style("justify-content", "center")
    .style("gap", "8px")
    .style("height", "100%");

// Dimensioni e margini
const marginImpianti = { top: 30, right: 30, bottom: 50, left: 60 },
      widthImpianti = 500 - marginImpianti.left - marginImpianti.right,
      heightImpianti = 300 - marginImpianti.top - marginImpianti.bottom;

// Append SVG dentro il wrapper
const svgImpianti = innerWrapper.append("svg")
    .attr("viewBox", `0 0 ${widthImpianti + marginImpianti.left + marginImpianti.right} ${heightImpianti + marginImpianti.top + marginImpianti.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto")
    .append("g")
    .attr("transform", `translate(${marginImpianti.left}, ${marginImpianti.top})`);

/**
 * Aggiorna il grafico delle distribuzioni gaussiane per tipo di impianto
 * @param {Array} data - Dataset CSV per uno stato selezionato
 */
function updateImpiantiChart(data) {
    svgImpianti.selectAll("*").remove();
    d3.select("#liftCapacityLabel").remove();

    // Tipi di impianto da analizzare
    const impiantoTypes = ["SurfaceLifts", "ChairLifts", "GondolaLifts"];
    const typeLabels = {
        "SurfaceLifts": "Draglift",
        "ChairLifts": "Chairlift",
        "GondolaLifts": "Gondola"
    };
    const baseColors = d3.schemeCategory10.slice(0, impiantoTypes.length);

    // Calcola la media della capacità totale (info testuale)
    const avgCapacity = d3.mean(data.map(d => +d.LiftCapacity).filter(d => !isNaN(d)));

    const distributions = [];

    // Per ciascun tipo, calcola la curva normale stimata
    impiantoTypes.forEach((type, i) => {
        const values = data
            .map(d => +d[type])
            .filter(v => !isNaN(v) && v > 0);

        if (values.length > 1) {
            const mean = d3.mean(values);
            const deviation = d3.deviation(values);

            const curveData = d3.range(0, d3.max(values) * 1.2, 0.5).map(xVal => ({
                x: xVal,
                y: (1 / (deviation * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((xVal - mean) / deviation, 2)) * values.length
            }));

            distributions.push({
                type,
                label: typeLabels[type],
                color: baseColors[i],
                data: curveData
            });
        }
    });

    // Scale X e Y comuni per tutte le curve
    const x = d3.scaleLinear()
        .domain([0, d3.max(distributions, d => d3.max(d.data, p => p.x))])
        .range([0, widthImpianti]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(distributions, d => d3.max(d.data, p => p.y))])
        .range([heightImpianti, 0]);

    const line = d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y));

    // Disegna curve
    distributions.forEach(distr => {
        svgImpianti.append("path")
            .datum(distr.data)
            .attr("fill", "none")
            .attr("stroke", distr.color)
            .attr("stroke-width", 2)
            .attr("d", line);
    });

    // Legenda
    const legend = svgImpianti.append("g")
        .attr("transform", `translate(${widthImpianti - 120}, 10)`);

    distributions.forEach((distr, i) => {
        legend.append("line")
            .attr("x1", 0)
            .attr("x2", 20)
            .attr("y1", i * 20)
            .attr("y2", i * 20)
            .attr("stroke", distr.color)
            .attr("stroke-width", 2);

        legend.append("text")
            .attr("x", 25)
            .attr("y", i * 20 + 5)
            .style("font-size", "12px")
            .text(distr.label);
    });

    // Assi
    svgImpianti.append("g")
        .attr("transform", `translate(0, ${heightImpianti})`)
        .call(d3.axisBottom(x).ticks(10));

    svgImpianti.append("g")
        .call(d3.axisLeft(y).ticks(6));

    // Etichette
    svgImpianti.append("text")
        .attr("x", widthImpianti / 2)
        .attr("y", heightImpianti + 40)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Lifts");

    svgImpianti.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -heightImpianti / 2)
        .attr("y", -40)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Estimated Frequency");

    // Etichetta sotto
    innerWrapper.append("div")
        .attr("id", "liftCapacityLabel")
        .style("font-size", "13px")
        .style("color", "#444")
        .text(`Avg Lift Capacity: ${Math.round(avgCapacity)} people/hour`);

    impiantiContainer.style("display", "block");
}

d3.select("#cella-2-2")
  .append("p")
  .attr("class", "grafico-descrizione")
  .style("margin-top", "10px")
  .style("text-align", "center")
  .text("This chart illustrates the estimated frequency of different ski lift types (draglifts, chairlifts, and gondolas), highlighting how common each category is within the country.");
