// Seleziona la cella 1,2 della tabella per le feature visive
const featureContainer = d3.select("#cella-1-2")
  .append("div")
  .attr("id", "featureIcons")
  .style("display", "flex")
  .style("flex-direction", "row")
  .style("align-items", "center")
  .style("justify-content", "center")
  .style("gap", "48px")
  .style("width", "100%")
  .style("height", "100%");

const featuresGroups = [
  [
    { id: "NightSki", label: "Night Ski", src: "../../imgs/NightSki.png" },
    { id: "SnowCannons", label: "Snow Cannons", src: "../../imgs/SnowCannons.png" },
    { id: "SnowPark", label: "Snow Park", src: "../../imgs/SnowPark.png" }
  ],
  [
    { id: "SkiLift", label: "Ski Lifts", src: "../../imgs/SkiLift.png" },
    { id: "ChairLift", label: "Chair Lifts", src: "../../imgs/ChairLift.png" },
    { id: "GondolaLift", label: "Gondola Lifts", src: "../../imgs/GondolaLift.png" }
  ]
];

const tooltips = {};
const resortMap = {}; // mappa dei resort per ogni feature (id)

featuresGroups.forEach(group => {
  const column = featureContainer.append("div")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("align-items", "center")
    .style("justify-content", "center")
    .style("gap", "24px");

  group.forEach(f => {
    const wrapper = column.append("div")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("align-items", "center")
      .style("justify-content", "center")
      .style("gap", "8px")
      .attr("class", "feature-wrapper")
      .style("position", "relative");

    const img = wrapper.append("img")
      .attr("id", `icon-${f.id}`)
      .attr("src", f.src)
      .style("width", "80px")
      .style("opacity", 0.25);

    wrapper.append("div")
      .style("font-size", "13px")
      .style("text-align", "center")
      .text(f.label);

    const tooltip = wrapper.append("div")
      .attr("class", "tooltip-feature")
      .style("position", "absolute")
      .style("bottom", "100%")
      .style("margin-bottom", "6px")
      .style("padding", "6px 10px")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("box-shadow", "0 0 5px rgba(0,0,0,0.2)")
      .style("font-size", "12px")
      .style("white-space", "nowrap")
      .style("display", "none");

    tooltips[f.id] = tooltip;

    img.on("mouseover", () => {
      tooltip.style("display", "block");
      if (resortMap[f.id]) highlightResorts(resortMap[f.id]);
    })
    .on("mouseout", () => {
      tooltip.style("display", "none");
      resetResortColors();
    });
  });
});

window.updateFeatureIcons = function (code) {
  const file = `../data/resorts_by_country/coordinates/${code}_with_coordinates.csv`;
  d3.csv(file).then(data => {
    const nightResorts = data.filter(d => d.NightSki && d.NightSki.toLowerCase() === "yes");
    const parkResorts = data.filter(d => d.Snowparks && d.Snowparks.toLowerCase() === "yes");
    const cannonResorts = data.filter(d => +d.SnowCannons > 0);
    const liftResorts = data.filter(d => +d.SurfaceLifts > 0);
    const chairResorts = data.filter(d => +d.ChairLifts > 0);
    const gondolaResorts = data.filter(d => +d.GondolaLifts > 0);

    resortMap["NightSki"] = nightResorts.map(d => d.Resort);
    resortMap["SnowPark"] = parkResorts.map(d => d.Resort);
    resortMap["SnowCannons"] = cannonResorts.map(d => d.Resort);
    resortMap["SkiLift"] = liftResorts.map(d => d.Resort);
    resortMap["ChairLift"] = chairResorts.map(d => d.Resort);
    resortMap["GondolaLift"] = gondolaResorts.map(d => d.Resort);

    d3.select("#icon-NightSki").style("opacity", nightResorts.length > 0 ? 1 : 0.25);
    d3.select("#icon-SnowPark").style("opacity", parkResorts.length > 0 ? 1 : 0.25);
    d3.select("#icon-SnowCannons").style("opacity", cannonResorts.length > 0 ? 1 : 0.25);
    d3.select("#icon-SkiLift").style("opacity", liftResorts.length > 0 ? 1 : 0.25);
    d3.select("#icon-ChairLift").style("opacity", chairResorts.length > 0 ? 1 : 0.25);
    d3.select("#icon-GondolaLift").style("opacity", gondolaResorts.length > 0 ? 1 : 0.25);

    const totalCannons = d3.sum(data, d => +d.SnowCannons || 0);
    const sumLift = d3.sum(data, d => +d.SurfaceLifts || 0);
    const sumChair = d3.sum(data, d => +d.ChairLifts || 0);
    const sumGondola = d3.sum(data, d => +d.GondolaLifts || 0);

    tooltips["NightSki"].text(`${nightResorts.length} resort${nightResorts.length !== 1 ? "s" : ""} with Night Skiing`);
    tooltips["SnowPark"].text(`${parkResorts.length} resort${parkResorts.length !== 1 ? "s" : ""} with SnowPark`);
    tooltips["SnowCannons"].text(`${cannonResorts.length} resort${cannonResorts.length !== 1 ? "s" : ""} with SnowCannons\n(${totalCannons} total)`);
    tooltips["SkiLift"].text(`${liftResorts.length} resort${liftResorts.length !== 1 ? "s" : ""} with Ski lifts (${sumLift} total)`);
    tooltips["ChairLift"].text(`${chairResorts.length} resort${chairResorts.length !== 1 ? "s" : ""} with Chair lifts (${sumChair} total)`);
    tooltips["GondolaLift"].text(`${gondolaResorts.length} resort${gondolaResorts.length !== 1 ? "s" : ""} with Gondola lifts (${sumGondola} total)`);
  });
};
