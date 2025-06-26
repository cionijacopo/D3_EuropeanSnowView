var mapContainer = d3.select('#mappa');
var mapWidth = mapContainer.node().getBoundingClientRect().width,
    mapHeight = 400,
    legendWidth = mapWidth,
    legendHeight = 100;

var geoJSONPath = '../data/geojson/europe.geojson';
var csvPath = '../data/resorts.csv';

class Mappa {
    constructor(container) {
        this.parent = container;
        this.name = 'Europe';
        this.currentState = null;
        this.projection = d3.geoNaturalEarth1();
        this.path = d3.geoPath().projection(this.projection);

        if (this.parent.select('#mapTitle').empty()) {
            this.title = this.parent.append('div')
                .attr('class', 'itemTitle')
                .attr('id', 'mapTitle');
        }
        this.setTitle(null);

        this.tooltip = d3.select('body').append('div')
            .attr('id', 'resortTooltip')
            .style('position', 'absolute')
            .style('background', 'white')
            .style('padding', '5px 10px')
            .style('border', '1px solid #ccc')
            .style('border-radius', '5px')
            .style('pointer-events', 'none')
            .style('font-size', '12px')
            .style('visibility', 'hidden');

        this.area = this.parent.append('svg')
            .attr('id', 'mapArea')
            .attr('width', mapWidth)
            .attr('height', mapHeight)
            .call(responsivefy);

        this.zoomGroup = this.area.append('g').attr('id', 'zoomGroup');

        this.background = this.zoomGroup.append('rect')
            .attr('class', 'background')
            .attr('width', mapWidth)
            .attr('height', mapHeight)
            .attr('fill', '#f5f5f5');

        this.states = this.zoomGroup.append('g').attr('id', 'statesGroup');
        this.resortPoints = this.zoomGroup.append('g').attr('id', 'resortPoints');

        this.legend = this.parent.append('div')
            .attr('id', 'mapLegend')
            .append('svg')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .call(responsivefy)
            .append('g')
            .attr('id', 'legendGroup')
            .attr('transform', 'translate(30,30)');

        Promise.all([
            d3.json(geoJSONPath),
            d3.csv(csvPath)
        ]).then(([geojson, csvData]) => {
            console.log('Dati caricati correttamente.');
            this.geojson = geojson;
            this.build(geojson, csvData);
        });
    }

    build(geojson, csvData) {
        const resortMap = new Map(csvData.map(d => [d.country_code, +d.resorts_count]));

        const colorScale = d3.scaleThreshold()
            .domain([1, 10, 20, 40, 60, 80])
            .range(['#e0e0e0', '#cce5ff', '#99ccff', '#66b2ff', '#3399ff', '#0073e6', '#004080']);

        this.projection.fitExtent([[0, 0], [mapWidth, mapHeight]], geojson);

        this.states.selectAll('path')
            .data(geojson.features)
            .enter()
            .append('path')
            .attr('d', this.path)
            .attr('class', 'mapRegion')
            .attr('fill', d => {
                const code = d.properties.ISO2;
                const value = resortMap.get(code);
                return value != null && value > 0 ? colorScale(value) : '#e0e0e0';
            })
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.5)
            .on('mouseover', (event, d) => {
                // Evita tutto se siamo in zoom su uno stato
                const currentZoom = this.zoomGroup.attr('data-zoom');
                if (currentZoom !== null) return;

                const code = d.properties.ISO2;
                const value = resortMap.get(code) || 0;

                this.setTitle(d.properties.NAME, value);

                const node = d3.select(event.currentTarget);
                if (!node.attr('original-fill')) {
                    node.attr('original-fill', node.attr('fill'));
                }
                node.attr('fill', 'crimson');

                updateSpider(code);
            })
            .on('mouseout', (event, d) => {
                const node = d3.select(event.currentTarget);
                
                // Ripristina colore solo se originale-fill è definito
                const original = node.attr('original-fill');
                if (original) {
                    node.attr('fill', original);
                }

                const isZoomed = this.zoomGroup.attr('data-zoom') !== null;
                if (!isZoomed) {
                    this.setTitle();
                }

                updateSpider(null);
            })
            .on('click', (event, d) => {
                const code = d.properties.ISO2;
                const value = resortMap.get(code) || 0;
                if(value > 0) {
                    this.handleZoom(d, value);
                }
            });
                
        const legend = d3.legendColor()
            .title('Number of Ski Resorts')
            .scale(colorScale)
            .labels(['0', '1–9', '10–19', '20–39', '40–59', '60–79', '≥ 80'])
            .shapeWidth(50)
            .shapePadding(5)
            .orient('horizontal');

        d3.select('#legendGroup').call(legend);
    }

    handleZoom(feature, value) {
        const code = feature.properties.ISO2;
        const isZoomed = this.zoomGroup.attr('data-zoom') === code;

        if (isZoomed) {
            // Torna alla vista Europa
            this.zoomGroup.transition().duration(750)
                .attr('transform', `translate(0,0) scale(1)`)
                .attr('data-zoom', null);

            this.setTitle(null);
            this.resortPoints.selectAll("circle").remove();

            // Torna alla vista iniziale
            d3.select("#vistaIniziale").style("display", "block");
            d3.select("#mapLegend").style("display", "block");
            d3.select("#vistaStato").style("display", "none");
            d3.select("#spiderContainer").style("display", "block");

            // Riporta mappa nel contenitore europeo (#mid)
            const mid = document.querySelector("#mid");
            const mappa = document.querySelector("#mappa");
            if (mid && mappa) {
                mid.insertBefore(mappa, mid.firstChild);
            }

            // Nascondi contenitori della vista dettaglio
            d3.select("#altitudeContainer").style("display", "none");
            d3.select("#pisteContainer").style("display", "none");
            d3.select("#prezzoContainer").style("display", "none");
            d3.select("#impiantiContainer").style("display", "none");
            d3.select("#sliderContainer").style("display", "none");

            d3.select("#footer")
                .style("visibility", "visible")
                .style("pointer-events", "auto");

        } else {
            // Zoom su paese
            const bounds = this.path.bounds(feature);
            const dx = bounds[1][0] - bounds[0][0];
            const dy = bounds[1][1] - bounds[0][1];
            const x = (bounds[0][0] + bounds[1][0]) / 2;
            const y = (bounds[0][1] + bounds[1][1]) / 2;
            const scale = Math.min(6, 0.9 / Math.max(dx / mapWidth, dy / mapHeight));
            const translate = [mapWidth / 2 - scale * x, mapHeight / 2 - scale * y];

            this.zoomGroup.transition().duration(750)
                .attr("transform", `translate(${translate}) scale(${scale})`)
                .attr('data-zoom', code);

            this.resortPoints.selectAll("*").remove();
            this.loadResorts(code);
            const file = `../data/resorts_by_country/coordinates/${code}_with_coordinates.csv`;
            d3.csv(file).then(data => {
                const label = value === 1 ? "Ski Resort" : "Ski Resorts";
                this.setTitle(`${feature.properties.NAME} — ${value} ${label}`);
                // Disegna grafico altitudine
                drawAltitudeChart(code);  // già esistente, con slider

                // Disegna scatter difficoltà piste
                if (typeof drawDifficultyScatter === "function") {
                    drawDifficultyScatter(code);
                    d3.select("#pisteContainer").style("display", "block");
                }

                // Disegna grafico prezzi
                if (typeof updatePrezzoChart === "function") {
                    updatePrezzoChart(data);
                    d3.select("#prezzoContainer").style("display", "block");
                }

                // Disegna grafico impianti 
                if (typeof updateImpiantiChart === "function") {
                    updateImpiantiChart(data);
                    d3.select("#impiantiContainer").style("display", "block");
                }
            });
            d3.select("#vistaIniziale").style("display", "none");
            d3.select("#mapLegend").style("display", "none");
            const mappaContent = document.querySelector("#mappa");
            const nuovaCella = document.querySelector("#cella-1-1");
            if (mappaContent && nuovaCella) {
                nuovaCella.appendChild(mappaContent);
            }
            d3.select("#vistaStato").style("display", "block");

            d3.select("#footer")
                .style("visibility", "hidden")
                .style("pointer-events", "none");
        }
    }


    loadResorts(code) {
        this.currentCountryCode = code; // memorizza codice corrente

        // Rimuove sempre i punti precedenti PRIMA
        this.resortPoints.selectAll("circle").remove();

        const file = `../data/resorts_by_country/coordinates/${code}_with_coordinates.csv`;

        d3.csv(file).then(data => {
            // Se nel frattempo l’utente ha cliccato su un altro stato, annulla
            if (this.currentCountryCode !== code) return;

            const valid = data.filter(d => d.latitude && d.longitude);

            this.resortPoints.selectAll("circle")
                .data(valid)
                .enter()
                .append("circle")
                .attr("cx", d => this.projection([+d.longitude, +d.latitude])[0])
                .attr("cy", d => this.projection([+d.longitude, +d.latitude])[1])
                .attr("r", 2)
                .attr("fill", "crimson")
                .attr("stroke", "#fff")
                .attr("stroke-width", 0.5)
                .attr("class", d => `resort-circle resort-${sanitizeID(d.Resort)}`)
                .on("mouseover", (event, d) => {
                    this.tooltip
                        .style("visibility", "visible")
                        .text(d.Resort)
                        .style("top", (event.pageY - 10) + "px")
                        .style("left", (event.pageX + 10) + "px");
                })
                .on("mousemove", event => {
                    this.tooltip
                        .style("top", (event.pageY - 10) + "px")
                        .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", () => {
                    this.tooltip.style("visibility", "hidden");
                });
        });
    }



    setTitle(name, value = null) {
        const element = d3.select("#mapTitle");
        if (!element.empty()) {
            if (name && typeof value === 'number') {
                const label = value === 1 ? 'Ski Resort' : 'Ski Resorts';
                element.html(`${name} — ${value} ${label}`);
            } else if (name) {
                element.html(name);
            } else {
                element.html("Europe");
            }
        }
    }
}

function responsivefy(svg) {
    const container = d3.select(svg.node().parentNode),
        width = parseInt(svg.style("width")),
        height = parseInt(svg.style("height")),
        aspect = width / height;

    svg.attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid")
        .call(resize);

    d3.select(window).on("resize." + container.attr("id"), resize);

    function resize() {
        const targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth);
        svg.attr("height", Math.round(targetWidth / aspect));
    }
}

function sanitizeID(str) {
    return String(str)
        .toLowerCase()
        .replace(/\s+/g, "-")        // spazi → trattini
        .replace(/[^a-z0-9\-]/g, ""); // rimuove caratteri speciali
}

// Evidenzia solo i resort con nome incluso in resortNames
window.highlightResorts = function(resortNames) {
    d3.selectAll(".resort-circle").attr("fill", "crimson");
    resortNames.forEach(name => {
        const className = `.resort-${sanitizeID(name)}`;
        d3.selectAll(className).attr("fill", "limegreen");
    });
};

// Ripristina colore rosso per tutti
window.resetResortColors = function() {
    d3.selectAll(".resort-circle").attr("fill", "crimson");
};

new Mappa(mapContainer);