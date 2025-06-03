var mapContainer = d3.select('#mappa');
var mapWidth = mapContainer.node().getBoundingClientRect().width,
    mapHeight = 400,
    legendWidth = mapWidth,
    legendHeight = 100;

var geoJSONPath = '../data/europe.geojson';
var csvPath = '../data/resorts.csv';

class Mappa{
    constructor(container) {
        this.parent = container;
        this.name = 'Europe';
        this.currentState = null;
        this.projection = d3.geoNaturalEarth1();
        this.path = d3.geoPath().projection(this.projection);
        // Titolo 
        this.title = this.parent.append('div').attr('class', 'itemTitle').attr('id', 'mapTitle');
        this.setTitle(null);
        // Tolltip
        this.tooltip = d3.select('body').append('div').attr('id', 'mapTooltip').style('opacity', 0).style('visibility', 'hidden');
        // SVG della mappa
        this.area = this.parent.append('svg').attr('id', 'mapArea').attr('width', mapWidth).attr('height', mapHeight).call(responsivefy);
        this.background = this.area.append('rect').attr('class', 'background').attr('width', mapWidth).attr('height', mapHeight).attr('fill', '#f5f5f5');
        // Gruppo stati
        this.states = this.area.append('g').attr('id', 'statesGroup');
        // Legenda della mappa
        this.legend = this.parent.append('div')
            .attr('id', 'mapLegend')
            .append('svg')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .call(responsivefy)
            .append('g')
            .attr('id', 'legendGroup')
            .attr('transform', 'translate(30,30)');
        // Carica i dati (GeoJSON + CSV)
        Promise.all([
            d3.json(geoJSONPath),
            d3.csv(csvPath)
        ]).then(([geojson, csvData]) => {
            console.log('Dati caricati correttamente.');
            this.build(geojson, csvData);
        });
    }

    build(geojson, csvData) {
        // Mappa da codice paese a numero di impianti
        const resortMap = new Map(csvData.map(d => [d.country_code, +d.resorts_count]));

        const max = d3.max(csvData, d => +d.resorts_count);
        // Scala di blu per gli impianti, nel caso di 0 impianti si vede il grigio
        const colorScale = d3.scaleThreshold()
            .domain([1, 10, 20, 40, 60, 80])
            .range(['#e0e0e0', '#cce5ff', '#99ccff', '#66b2ff', '#3399ff', '#0073e6', '#004080']);


        // Adatta la proiezione ai dati
        this.projection.fitExtent([[0, 0], [mapWidth, mapHeight]], geojson);

        // Disegna i paesi
        this.states.selectAll('path')
            .data(geojson.features)
            .enter()
            .append('path')
            .attr('d', this.path)
            .attr('class', 'mapRegion')
            .attr('fill', d => {
                const code = d.properties.ISO2;
                const value = resortMap.get(code);
                // console.log(d.properties);
                if (value === 0) return '#e0e0e0';
                return value != null ? colorScale(value) : '#e0e0e0';
            })
            .attr('stroke', '#000000') // Colore del bordo
            .attr('stroke-width', 0.5) // Spessore del bordo
            .attr('data-value', d => resortMap.get(d.properties.ISO2) || 0)
            .on('mouseover', (event, d) => {
                const code = d.properties.ISO2;
                const value = resortMap.get(code) || 0;
                this.setTitle(d.properties.NAME, value);
                this.tooltip
                    .style('visibility', 'visible')
                    .style('top', event.pageY - 10 + 'px')
                    .style('left', event.pageX + 10 + 'px')
                    .transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`${d.properties.NAME}: ${value} impianti`);
            })
            .on('mouseout', () => {
                this.tooltip.style('visibility', 'hidden');
                this.setTitle();
            });

        // Legenda
        const legend = d3.legendColor()
            .title('Numero di impianti')
            .scale(colorScale)
            .labels([
                '0',
                '1–9',
                '10–19',
                '20–39',
                '40–59',
                '60–79',
                '≥ 80'
            ])
            .shapeWidth(50)
            .shapePadding(5)
            .orient('horizontal');

        d3.select('#legendGroup').call(legend);

    }

    setTitle(name, value = null) {
        this.name = name || 'Europa';
        let title = this.name;

        if (value !== null) {
            title += ` — ${value} impianti`;
        }

        this.title.html(title);
    }

}

function responsivefy(svg) {
    const container = d3.select(svg.node().parentNode),
        width = parseInt(svg.style("width")),
        height = parseInt(svg.style("height")),
        aspect = width / height;

    svg.attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMinYMid")
        .call(resize);

    d3.select(window).on("resize." + container.attr("id"), resize);

    function resize() {
        const targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth);
        svg.attr("height", Math.round(targetWidth / aspect));
    }
}


// Crea la mappa all’avvio
new Mappa(mapContainer);
