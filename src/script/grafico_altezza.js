// Seleziona la cella 1,3 della tabella per il grafico altitudini
const chartContainer = d3.select("#cella-1-3")
    .append("div")
    .attr("id", "altitudeContainer")
    .style("display", "none")
    .style("flex-direction", "column")
    .style("align-items", "center")
    .style("justify-content", "center");

const margin = { top: 60, right: 40, bottom: 75, left: 90 },
      width = 500 - margin.left - margin.right,
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
const sliderContainer = d3.select("#cella-1-3")
    .append("div")
    .attr("id", "sliderContainer")
    .style("height", "auto")
    .style("display", "none")
    .style("margin-top", "20px")
    .style("align-self", "center");


// Tooltip per visualizzare il numero di resort
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

// Funzione principale per aggiornare il grafico
function updateAltitudeChart(data, maxAltitude) {
    svg.selectAll("*").remove();

    // Generazione dei gruppi
    const bins = [0, 1000, 1250, 1500, 1750, 2000, 2500, 3000];
    const filtered = data
        .filter(d => +d.HighestPoint && +d.TotalSlope && +d.HighestPoint <= maxAltitude);

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

    // Generazione delle etichette per i gruppi
    const orderedBins = [
        "0–1000m",
        "1000–1250m",
        "1250–1500m",
        "1500–1750m",
        "1750–2000m",
        "2000–2500m",
        "2500–3000m",
        "≥ 3000m"
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
            const [x, y] = d3.pointer(event);
            tooltip.style("display", "block")
                .style("left", (event.pageX - 20) + "px")
                .style("top", (event.pageY - 40) + "px")
                .html(`${d[1].count} ski resorts`);
            highlightResorts(d[1].resorts);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
            resetResortColors();
        });


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
        d3.select("#altitudeContainer").style("display", "flex");
        d3.select("#sliderContainer").style("display", "flex");

        // Calcola l’altitudine massima effettiva nel dataset
        const maxAltitudeFound = d3.max(data, d => +d.HighestPoint || 0);
        const roundedMax = Math.ceil(maxAltitudeFound / 250) * 250;

        // Pulisci eventuali slider precedenti
        d3.select("#sliderContainer").selectAll("*").remove();
        // Rende visibile il contenitore del secondo grafico (piste)
        d3.select("#pisteContainer").style("display", "block");

        // Ricrea lo slider
        const slider = d3.select("#sliderContainer").append("input")
            .attr("type", "range")
            .attr("min", 1000)
            .attr("max", roundedMax)
            .attr("step", 250)
            .attr("value", roundedMax)
            .style("width", "250px");  // larghezza orizzontale

        // Etichetta dinamica dello slider
        const sliderLabel = d3.select("#sliderContainer").append("div")
            .attr("id", "sliderLabel")
            .style("margin-top", "4px")
            .style("text-align", "center")
            .style("width", "100%") // forza centratura
            .style("font-size", "13px")
            .text(`Max Altitude: ${roundedMax}m`);


        // Disegna inizialmente il grafico
        updateAltitudeChart(data, roundedMax);
        if (typeof updatePisteChart === "function") {
            updatePisteChart(data, roundedMax);
        }

        // Listener per interazione
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


// Funzione per nascondere
function hideAltitudeChart() {
    // Nascondi il grafico altitudine e slider
    d3.select("#altitudeChart").style("display", "none");
    d3.select("#sliderContainer").style("display", "none");
    d3.select("#pisteContainer").style("display", "none");
    d3.select("#prezzoContainer").style("display", "none");
    // Mostra di nuovo lo spider plot
    d3.select("#spiderContainer").style("display", "block");
}