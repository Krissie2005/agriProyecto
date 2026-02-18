const map = L.map("map").setView([-1.8, -78.2], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

function getColor(r) {
  if (r === "Alto") return "#d73027";
  if (r === "Medio") return "#fdae61";
  if (r === "Bajo") return "#1a9850";
  return "#bdbdbd";
}

function style(feature) {
  const r = feature.properties.RIESGO_INUNDACION;
  return { fillColor: getColor(r), weight: 0.8, color: "#ffffff", fillOpacity: 0.65 };
}

let geoLayer = null;
let allFeatures = [];
let highlightedLayers = [];

function highlight(e) {
  const layer = e.target;
  layer.setStyle({ weight: 2.5, color: "#000000", fillOpacity: 0.80 });
  layer.bringToFront();
}
function reset(e) {
  geoLayer.resetStyle(e.target);
}

function onEachFeature(feature, layer) {
  const p = feature.properties;

  const parroquia = p.DPA_DESPAR || "Parroquia";
  const canton = p.DPA_DESCAN || "Cantón";
  const provincia = p.DPA_DESPRO || "Provincia";

  const tooltipHTML = `
    <div style="font-size:12px; line-height:1.25;">
      <b>Parroquia:</b> ${parroquia}<br>
      <b>Cantón:</b> ${canton}<br>
      <b>Provincia:</b> ${provincia}
    </div>
  `;

  layer.bindTooltip(tooltipHTML, {
    sticky: false,
    direction: "top",
    opacity: 0.95,
    className: "my-tooltip"
  });

  layer.on("mouseover", (e) => {
    highlight(e);

    map.closeTooltip();

    layer.openTooltip();
  });

  layer.on("mouseout", (e) => {
    reset(e);
    layer.closeTooltip();
  });

  layer.on("click", () => {
    const riesgo = p.RIESGO_INUNDACION ?? "Sin predicción";
    const score = (p.SCORE !== null && p.SCORE !== undefined) ? p.SCORE : "N/A";

    layer.bindPopup(`
      <div style="font-size:14px;">
        <b>${parroquia}</b><br>
        ${canton} - ${provincia}<br><br>
        <b>Riesgo de inundación:</b> ${riesgo}<br>
        <b>Score/Probabilidad:</b> ${score}
      </div>
    `).openPopup();
  });
}

// --- BUSCADOR (Provincia/Cantón/Parroquia) ---
const selProvincia = document.getElementById("selProvincia");
const selCanton = document.getElementById("selCanton");
const selParroquia = document.getElementById("selParroquia");
const btnBuscar = document.getElementById("btnBuscar");
const btnReset = document.getElementById("btnReset");

function uniqSorted(arr) {
  return [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}

function fillSelect(select, items, placeholder) {
  select.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = placeholder;
  select.appendChild(opt0);

  items.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
}

function updateCantones() {
  const prov = selProvincia.value;
  const cantones = uniqSorted(
    allFeatures
      .filter(f => !prov || f.properties.DPA_DESPRO === prov)
      .map(f => f.properties.DPA_DESCAN)
  );
  fillSelect(selCanton, cantones, "-- Todos --");
  updateParroquias();
}

function updateParroquias() {
  const prov = selProvincia.value;
  const cant = selCanton.value;

  const parroquias = uniqSorted(
    allFeatures
      .filter(f => (!prov || f.properties.DPA_DESPRO === prov) && (!cant || f.properties.DPA_DESCAN === cant))
      .map(f => f.properties.DPA_DESPAR)
  );
  fillSelect(selParroquia, parroquias, "-- Todas --");
}

function buscarYZoom() {

  const prov = selProvincia.value;
  const cant = selCanton.value;
  const parr = selParroquia.value;

  highlightedLayers.forEach(layer => {
    geoLayer.resetStyle(layer);
  });
  highlightedLayers = [];

  const matches = [];

  geoLayer.eachLayer(layer => {
    const p = layer.feature.properties;

    const ok =
      (!prov || p.DPA_DESPRO === prov) &&
      (!cant || p.DPA_DESCAN === cant) &&
      (!parr || p.DPA_DESPAR === parr);

    if (ok) {
      matches.push(layer);
    }
  });

  if (matches.length === 0) {
    alert("No se encontró coincidencia con esos filtros.");
    return;
  }

  matches.forEach(layer => {
    layer.setStyle({
      weight: 3,
      color: "#000000",
      fillOpacity: 0.9
    });
    layer.bringToFront();
    highlightedLayers.push(layer);
  });

  const group = L.featureGroup(matches);
  map.fitBounds(group.getBounds());
}

function resetBusqueda() {
  selProvincia.value = "";
  updateCantones();
  // zoom a todo
  if (geoLayer) map.fitBounds(geoLayer.getBounds());
}

selProvincia.addEventListener("change", updateCantones);
selCanton.addEventListener("change", updateParroquias);
btnBuscar.addEventListener("click", buscarYZoom);
btnReset.addEventListener("click", resetBusqueda);

// --- Cargar GeoJSON y poblar buscador ---
fetch("/geojson")
  .then(r => r.json())
  .then(data => {
    allFeatures = data.features;

    geoLayer = L.geoJSON(data, { style, onEachFeature }).addTo(map);
    map.fitBounds(geoLayer.getBounds());

    const provincias = uniqSorted(allFeatures.map(f => f.properties.DPA_DESPRO));
    fillSelect(selProvincia, provincias, "-- Todas --");
    updateCantones();
  })
  .catch(err => console.log("Error:", err));

// Leyenda
const legend = L.control({ position: "bottomright" });
legend.onAdd = function () {
  const div = L.DomUtil.create("div");
  div.style.background = "white";
  div.style.padding = "10px";
  div.style.borderRadius = "6px";
  div.style.boxShadow = "0 0 6px rgba(0,0,0,0.3)";
  div.innerHTML = `
    <b>Categoría de Riesgo de Inundación</b><br>
    <div><span style="display:inline-block;width:14px;height:14px;background:${getColor("Alto")};margin-right:6px;"></span>Alto</div>
    <div><span style="display:inline-block;width:14px;height:14px;background:${getColor("Medio")};margin-right:6px;"></span>Medio</div>
    <div><span style="display:inline-block;width:14px;height:14px;background:${getColor("Bajo")};margin-right:6px;"></span>Bajo</div>
    <div><span style="display:inline-block;width:14px;height:14px;background:${getColor(null)};margin-right:6px;"></span>Unknown</div>
  `;
  return div;
};
legend.addTo(map);