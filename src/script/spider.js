// spider.js

// Dimensioni e margini per il radar chart
const radarWidth = 400;
const radarHeight = 400;
const radarRadius = Math.min(radarWidth, radarHeight) / 2 - 40;

// Titolo sopra il grafico
d3.select("#grafico")
    .append("div")
    .attr("class", "itemTitle")
    .style("text-align", "center")
    .style("margin-bottom", "10px")
    .text("Main Features (Avg)");

// Checkbox per abilitare/disabilitare i tooltip
const checkboxContainer = d3.select("#grafico")
    .append("div")
    .style("text-align", "center")
    .style("margin-bottom", "10px");

checkboxContainer.append("input")
    .attr("type", "checkbox")
    .attr("id", "showTooltip");

checkboxContainer.append("label")
    .attr("for", "showTooltip")
    .text(" Mostra valori dettagliati");

// Container SVG
const radarSvg = d3.select("#grafico")
    .append("svg")
    .attr("id", "spiderArea")
    .attr("width", radarWidth)
    .attr("height", radarHeight)
    .append("g")
    .attr("transform", `translate(${radarWidth / 2}, ${radarHeight / 2})`);

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

// Etichette leggibili per i tooltip/assi
const readableLabels = {
    Avg_Total_Slopes: "N. Slopes",
    Avg_Total_Lifts: "N. Lifts",
    Avg_Highest_Point: "Highest Point",
    Avg_Snow_Cannons: "N. Cannons",
    Avg_Day_Pass_Price: "Day Price"
};

// Caricamento del CSV con i dati medi per stato
d3.csv("../data/media_per_country.csv", d3.autoType).then(data => {
    radarData = data;

    // Costruisci le scale normalizzate per ogni variabile
    axisLabels.forEach(d => {
        radarScales[d] = d3.scaleLinear()
            .domain([0, d3.max(data, r => r[d])])
            .range([0, radarRadius]);
    });

    // Numero di livelli concentrici
    const levels = 5;
    const gridGroup = radarSvg.append("g").attr("class", "radarGrid");

    for (let level = 1; level <= levels; level++) {
        const r = (radarRadius / levels) * level;

        gridGroup.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", r)
            .style("fill", "none")
            .style("stroke", "#ccc")
            .style("stroke-dasharray", "2,2")
            .style("stroke-width", 0.5);

        gridGroup.append("text")
            .attr("x", 5)
            .attr("y", -r)
            .attr("dy", "-0.3em")
            .attr("font-size", "10px")
            .style("fill", "#666")
            .text((r / radarRadius).toFixed(1));
    }

    const numAxes = axisLabels.length;
    const angleSlice = (Math.PI * 2) / numAxes;
    const axisGroup = radarSvg.append("g").attr("class", "axes");

    axisLabels.forEach((label, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const x = radarRadius * Math.cos(angle);
        const y = radarRadius * Math.sin(angle);

        axisGroup.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", x)
            .attr("y2", y)
            .attr("stroke", "#aaa")
            .attr("stroke-width", 1);

        axisGroup.append("text")
            .attr("x", x * 1.15)
            .attr("y", y * 1.15)
            .attr("dy", "0.35em")
            .style("font-size", "12px")
            .style("text-anchor", "middle")
            .text(readableLabels[label]);
    });
});

d3.select("#showTooltip").on("change", function () {
    showRadarTooltip = this.checked;
    radarSvg.selectAll(".axisValue").remove();  
    // Redisegna se un paese è selezionato
    updateSpider(currentCountryCode);
});

function updateSpider(countryCode) {
    currentCountryCode = countryCode;

    radarSvg.selectAll(".radarArea").remove();
    radarSvg.selectAll(".radarPoint").remove();
    radarSvg.selectAll(".radarTooltip").remove();

    if (!countryCode) {
        radarSvg.selectAll(".axisValue").remove();
            if (showRadarTooltip) {
                const numAxes = axisLabels.length;
                const angleSlice = (Math.PI * 2) / numAxes;

                axisLabels.forEach((key, i) => {
                    const angle = angleSlice * i - Math.PI / 2;
                    const x = radarRadius * Math.cos(angle) * 1.15;
                    const y = radarRadius * Math.sin(angle) * 1.15;

                    radarSvg.append("text")
                        .attr("class", "axisValue")
                        .attr("x", x)
                        .attr("y", y + 15)
                        .attr("text-anchor", "middle")
                        .attr("font-size", "11px")
                        .style("fill", "#333")
                        .text("0.00");
                });
            }
        return;
    }


    const entry = radarData.find(d => d.country_code === countryCode);
    if (!entry) return;

    const numAxes = axisLabels.length;
    const angleSlice = (Math.PI * 2) / numAxes;

    const points = axisLabels.map((key, i) => {
        const value = entry[key];
        const radius = radarScales[key](value);
        const angle = angleSlice * i - Math.PI / 2;
        return [radius * Math.cos(angle), radius * Math.sin(angle)];
    });

    points.push(points[0]);

    radarSvg.append("path")
        .datum(points)
        .attr("class", "radarArea")
        .attr("fill", "steelblue")
        .attr("fill-opacity", 0.5)
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", d3.line()(points));

    if (showRadarTooltip && entry) {
        axisLabels.forEach((key, i) => {
            const value = entry[key];
            const radius = radarScales[key](value);
            const angle = angleSlice * i - Math.PI / 2;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            radarSvg.append("circle")
                .attr("class", "radarPoint")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 4)
                .attr("fill", "steelblue")
                .on("mouseover", function () {
                    d3.select(this).transition().duration(150).attr("r", 6);

                    radarSvg.append("text")
                    .attr("class", "radarTooltip")
                    .attr("x", x)
                    .attr("y", y - 10)
                    .attr("text-anchor", "middle")
                    .style("font-size", "11px")
                    .style("font-weight", "bold")
                    .text(value.toFixed(1));
                })
                .on("mouseout", function () {
                    d3.select(this).transition().duration(150).attr("r", 4);
                    radarSvg.selectAll(".radarTooltip").remove();
                });
        });
    }

    radarSvg.selectAll(".axisValue").remove();

    if(showRadarTooltip && entry) {
        axisLabels.forEach((key, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const x = radarRadius * Math.cos(angle) * 1.15;
        const y = radarRadius * Math.sin(angle) * 1.15;

        const value = entry ? entry[key] : 0;

        radarSvg.append("text")
            .attr("class", "axisValue")
            .attr("x", x)
            .attr("y", y + 15)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .style("fill", "#333")
            .text(value.toFixed(2));
         });
    }
}
