// Seleziona la cella 1,2 della tabella per le feature visive
const featureContainer = d3.select("#cella-1-2")
  .append("div")
  .attr("id", "featureIcons")
  .style("display", "flex")
  .style("flex-direction", "column")
  .style("align-items", "center")
  .style("justify-content", "center")
  .style("gap", "24px")
  .style("width", "100%")
  .style("height", "100%");

const features = [
  { id: "NightSki", label: "Night Ski", src: "../../imgs/NightSki.png" },
  { id: "SnowCannons", label: "Snow Cannons", src: "../../imgs/SnowCannons.png" },
  { id: "SnowPark", label: "Snow Park", src: "../../imgs/SnowPark.png" }
];

const tooltips = {};

features.forEach(f => {
  const wrapper = featureContainer.append("div")
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

  img.on("mouseover", () => tooltip.style("display", "block"))
     .on("mouseout", () => tooltip.style("display", "none"));
});

window.updateFeatureIcons = function (code) {
  const file = `../data/resorts_by_country/coordinates/${code}_with_coordinates.csv`;
  d3.csv(file).then(data => {
    const countNight = data.filter(d => d.NightSki && d.NightSki.toLowerCase() === "yes").length;
    const countPark = data.filter(d => d.Snowparks && d.Snowparks.toLowerCase() === "yes").length;
    const countCannons = data.filter(d => +d.SnowCannons > 0).length;
    const totalCannons = d3.sum(data, d => +d.SnowCannons || 0);

    d3.select("#icon-NightSki").style("opacity", countNight > 0 ? 1 : 0.25);
    d3.select("#icon-SnowPark").style("opacity", countPark > 0 ? 1 : 0.25);
    d3.select("#icon-SnowCannons").style("opacity", countCannons > 0 ? 1 : 0.25);

    tooltips["NightSki"].text(`${countNight} resort${countNight !== 1 ? "s" : ""} with night skiing`);
    tooltips["SnowPark"].text(`${countPark} resort${countPark !== 1 ? "s" : ""} with snow park`);
    tooltips["SnowCannons"].text(`${countCannons} resort${countCannons !== 1 ? "s" : ""} with snow cannons\n(${totalCannons} cannons total)`);
  });
};
