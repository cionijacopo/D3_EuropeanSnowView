// Cella 2,3 – Scatterplot difficoltà vs altitudine 
const pisteContainer = d3.select("#cella-2-3")
    .append("div")
    .attr("id", "pisteContainer")
    .style("display", "none")
    .style("margin-top", "8px")
    .style("width", "100%");

// Wrapper interno per contenere l'SVG centrato
const innerWrapperPiste = pisteContainer.append("div")
    .attr("id", "pisteInnerWrapper")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("align-items", "center")
    .style("justify-content", "center")
    .style("height", "100%")
    .style("width", "100%");

// Definizione margini e dimensioni del grafico
const marginPiste = { top: 70, right: 30, bottom: 60, left: 60 },
    widthPiste = 500 - marginPiste.left - marginPiste.right,
    heightPiste = 400 - marginPiste.top - marginPiste.bottom;

// Crea l'SVG responsivo all’interno del wrapper
const svgPiste = innerWrapperPiste.append("svg")
    .attr("id", "pisteChart")
    .attr("viewBox", `0 0 ${widthPiste + marginPiste.left + marginPiste.right} ${heightPiste + marginPiste.top + marginPiste.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto")
    .append("g")
    .attr("transform", `translate(${marginPiste.left},${marginPiste.top})`);

// Tooltip fluttuante per mostrare info sui resort
const tooltipPiste = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#ffffff")
    .style("border", "1px solid #ccc")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font-size", "13px")
    .style("box-shadow", "0 0 5px rgba(0,0,0,0.2)")
    .style("display", "none");

/**
 * Disegna lo scatterplot Altitudine vs Difficoltà media
 * @param {string} stateCode - codice ISO2 dello stato selezionato
 */
function drawDifficultyScatter(stateCode) {
    svgPiste.selectAll("*").remove();

    // Costruzione percorso CSV per il paese
    const file = `data/resorts_by_country/coordinates/${stateCode}_with_coordinates.csv`;

    // Caricamento CSV dei resort per stato
    d3.csv(file).then(data => {
        // Scala colore dal verde (facile) al rosso (difficile)
        const colorScale = d3.scaleLinear()
            .domain([1, 3])
            .range(["#00cc44", "#cc0000"]);

        // elaborazione dei dati calcolando il punteggio di difficoltà
        const processed = data.map(d => {
            const beginner = +d.BeginnerSlope || 0;
            const intermediate = +d.IntermediateSlope || 0;
            const difficult = +d.DifficultSlope || 0;
            const total = beginner + intermediate + difficult;
            const score = total === 0 ? 0 : (beginner + 2 * intermediate + 3 * difficult) / total;
            return {
                name: d.Resort,
                highest: +d.HighestPoint || 0,
                beginner,
                intermediate,
                difficult,
                total,
                score
            };
        }).filter(d => d.total > 0 && d.highest > 0);

        const x = d3.scaleLinear()
        .domain(d3.extent(processed, d => d.highest))
        .nice()
        .range([0, widthPiste]);

        const y = d3.scaleLinear()
        .domain([1, 3])
        .nice()
        .range([heightPiste, 0]);

        svgPiste.append("g")
        .attr("transform", `translate(0, ${heightPiste})`)
        .call(d3.axisBottom(x));

        svgPiste.append("g")
        .call(d3.axisLeft(y));

        svgPiste.append("text")
        .attr("x", widthPiste / 2)
        .attr("y", heightPiste + 40)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Highest Point (m)");

        svgPiste.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -heightPiste / 2)
        .attr("y", -45)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Average Difficulty Score");

        // Crea i cerchi dello scatterplot
        svgPiste.selectAll("circle")
        .data(processed)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.highest))
        .attr("cy", d => y(d.score))
        .attr("r", 7)
        .attr("fill", d => colorScale(d.score))
        .on("mouseover", (event, d) => {
            tooltipPiste
            .style("display", "block")
            .html(`<strong>${d.name}</strong><br/>
                    Beginner: ${d.beginner} km<br/>
                    Intermediate: ${d.intermediate} km<br/>
                    Difficult: ${d.difficult} km<br/>
                    Total: ${d.total} km<br/>
                    Score: ${d.score.toFixed(2)}`);
        })
        .on("mousemove", event => {
            const tooltipWidth = tooltipPiste.node().offsetWidth;
            const tooltipHeight = tooltipPiste.node().offsetHeight;
            const pageX = event.pageX;
            const pageY = event.pageY;
            // Posizionamento dinamico tooltip
            const offsetX = (pageX + tooltipWidth > window.innerWidth) ? -tooltipWidth - 20 : 10;

            tooltipPiste
            .style("left", (pageX + offsetX) + "px")
            .style("top", (pageY - tooltipHeight / 2) + "px");
        })
        .on("mouseout", () => tooltipPiste.style("display", "none"));

        // Legenda colori difficoltà 
        const defs = svgPiste.append("defs");
        const gradient = defs.append("linearGradient")
        .attr("id", "difficultyGradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

        gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#00cc44"); //facile

        gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#cc0000"); //difficile

        svgPiste.append("rect")
        .attr("x", widthPiste - 160)
        .attr("y", -10)
        .attr("width", 120)
        .attr("height", 10)
        .style("fill", "url(#difficultyGradient)");

        svgPiste.append("text")
        .attr("x", widthPiste - 165)
        .attr("y", 15)
        .style("font-size", "11px")
        .text("Easy");

        svgPiste.append("text")
        .attr("x", widthPiste - 40)
        .attr("y", 15)
        .style("font-size", "11px")
        .style("text-anchor", "end")
        .text("Hard");

        // Mostra il grafico 
        d3.select("#pisteContainer").style("display", "block");
    });
}

d3.select("#cella-2-3")
  .append("p")
  .attr("class", "grafico-descrizione")
  .style("margin-top", "10px")
  .style("text-align", "center")
  .text("This scatterplot explores the relationship between the maximum altitude of ski resorts and the average difficulty of their slopes, showing whether higher resorts tend to have harder pistes.");