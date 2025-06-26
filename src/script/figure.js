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

features.forEach(f => {
  const wrapper = featureContainer.append("div")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("align-items", "center")
    .style("justify-content", "center")
    .style("gap", "8px")
    .attr("class", "feature-wrapper");

  wrapper.append("img")
    .attr("id", `icon-${f.id}`)
    .attr("src", f.src)
    .style("width", "80px")
    .style("opacity", 0.25);

  wrapper.append("div")
    .style("font-size", "13px")
    .style("text-align", "center")
    .text(f.label);
});

window.updateFeatureIcons = function (code) {
  const file = `../data/resorts_by_country/coordinates/${code}_with_coordinates.csv`;
  d3.csv(file).then(data => {
    const hasNight = data.some(d => d.NightSki && d.NightSki.toLowerCase() === "yes");
    const hasPark = data.some(d => d.Snowparks && d.Snowparks.toLowerCase() === "yes");
    const hasCannons = data.some(d => +d.SnowCannons > 0);

    d3.select("#icon-NightSki").style("opacity", hasNight ? 1 : 0.25);
    d3.select("#icon-SnowPark").style("opacity", hasPark ? 1 : 0.25);
    d3.select("#icon-SnowCannons").style("opacity", hasCannons ? 1 : 0.25);
  });
};
