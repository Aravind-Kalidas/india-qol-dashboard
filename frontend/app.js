// Global State variables
let selectedMetric = "life_index";
let selectedSlice = "overall"; // overall, male, female, rural, urban
let selectedStateId = null; // null means National Overview
let activeYear = 2025; // timeline year
let activeMonth = 6; // timeline month (for AQI daily)
let activeDay = 15; // timeline day (for AQI daily)
let activeNationalTab = "numbers"; // numbers, rankings
let showMapNumbers = true; // Lead with state scores & labels on initial load

// Comparison Mode state
let compareModeActive = false;
let selectedStateAId = null;
let selectedStateBId = null;

// Playback Time-Lapse state
let isPlaying = false;
let playbackTimer = null;

let nationalData = null;
let metadataData = null;
let geoJsonData = null;

let map = null;
let geoJsonLayer = null;
const charts = {};

// METRIC CONFIGURATIONS (Expanded to 20 metrics)
const METRICS_CONFIG = {
    life_index: { label: "Quality of Life Index", fmt: v => v.toFixed(1), min: 55, max: 85, unit: "", slices: null, worldAvg: "71.4", desc: "Aggregated measure of clean housing, literacy, lifespan, sanitation, and safety representing overall standard of living." },
    literacy_rate: { label: "Literacy Rate", fmt: v => v.toFixed(1) + "%", min: 60, max: 98, unit: "%", slices: ["overall", "male", "female"], worldAvg: "87.0%", desc: "Percentage of the population aged 7 years and older who can read and write with understanding." },
    water_quality_score: { label: "Water Quality Score", fmt: v => v.toFixed(1) + "%", min: 50, max: 98, unit: "%", slices: null, worldAvg: "74.0%", desc: "Percentage of tested public drinking water samples meeting national potable safety standards." },
    equality_index: { label: "Equality / Gender Parity Index", fmt: v => v.toFixed(1), min: 45, max: 85, unit: "", slices: null, worldAvg: "68.5", desc: "Measures gender parity and equality across wages, secondary education enrollment, and municipal representation." },
    crime_against_women: { label: "Crime Against Women", fmt: v => v.toFixed(1), min: 5, max: 150, unit: " per 100k", slices: null, reverse: true, worldAvg: "31.0", desc: "Incidence rate of reported crimes against women per 100,000 female population." },
    crime_against_minorities: { label: "Crime Against Minorities", fmt: v => v.toFixed(1), min: 0, max: 50, unit: " per 100k", slices: null, reverse: true, worldAvg: "12.5", desc: "Incidence rate of reported crimes against Scheduled Castes/Tribes per 100,000 minority population." },
    infant_mortality_rate: { label: "Infant Mortality Rate (IMR)", fmt: v => v.toFixed(1), min: 5, max: 40, unit: " per 1,000", slices: ["overall", "rural", "urban"], reverse: true, worldAvg: "27.0", desc: "Number of deaths of children under one year of age per 1,000 live births." },
    child_stunting_rate: { label: "Child Stunting Rate", fmt: v => v.toFixed(1) + "%", min: 15, max: 45, unit: "%", slices: null, reverse: true, worldAvg: "22.3%", desc: "Percentage of children under age 5 who have a low height-for-age, indicating chronic malnutrition." },
    per_capita_gsdp: { label: "Per Capita GSDP", fmt: v => "₹" + Math.round(v).toLocaleString('en-IN'), min: 50000, max: 450000, unit: " INR", slices: null, worldAvg: "₹11.2L", desc: "Gross State Domestic Product divided by mid-year population, measuring individual economic output." },
    unemployment_rate: { label: "Unemployment Rate", fmt: v => v.toFixed(1) + "%", min: 2, max: 12, unit: "%", slices: ["overall", "rural", "urban"], reverse: true, worldAvg: "5.1%", desc: "Percentage of the active labor force that is without work and actively seeking employment." },
    clean_cooking_fuel: { label: "Access to Clean Cooking Fuel", fmt: v => v.toFixed(1) + "%", min: 40, max: 98, unit: "%", slices: null, worldAvg: "74.0%", desc: "Percentage of households with primary access to clean cooking fuels like LPG or electricity." },
    internet_penetration: { label: "Internet Penetration", fmt: v => v.toFixed(1) + "%", min: 35, max: 95, unit: "%", slices: ["overall", "rural", "urban"], worldAvg: "67.4%", desc: "Percentage of the population with regular access to mobile broadband or fixed-line internet." },
    water_scarcity_index: { label: "Water Scarcity Index", fmt: v => v.toFixed(1), min: 15, max: 80, unit: "", slices: null, reverse: true, worldAvg: "34.0", desc: "Index representing seasonal stress and depletion levels of surface and groundwater resources." },
    gov_schools_percentage: { label: "Government Schools %", fmt: v => v.toFixed(1) + "%", min: 35, max: 90, unit: "%", slices: null, worldAvg: "81.5%", desc: "Proportion of total primary and secondary schools managed directly by government authorities." },
    pupil_teacher_ratio: { label: "Pupil-Teacher Ratio (PTR)", fmt: v => v.toFixed(1) + ":1", min: 12, max: 35, unit: ":1", slices: null, reverse: true, worldAvg: "21.0:1", desc: "Average number of enrolled students per active teacher in primary and secondary schools." },
    school_infrastructure_score: { label: "School Infrastructure Score", fmt: v => v.toFixed(1) + "%", min: 50, max: 98, unit: "%", slices: null, worldAvg: "78.5%", desc: "Percentage of schools equipped with basic electricity, drinking water, and separate functional toilets." },
    forest_cover_percentage: { label: "Forest Cover %", fmt: v => v.toFixed(1) + "%", min: 5, max: 85, unit: "%", slices: null, worldAvg: "31.2%", desc: "Proportion of geographical area covered by forest canopy density of 10% or more." },
    sanitation_score: { label: "Sanitation Index", fmt: v => v.toFixed(1), min: 50, max: 95, unit: "", slices: null, worldAvg: "78.0", desc: "Index evaluating solid waste management, wastewater treatment, and open-defecation-free status." },
    renewable_energy_share: { label: "Renewable Energy Share %", fmt: v => v.toFixed(1) + "%", min: 5, max: 70, unit: "%", slices: null, worldAvg: "30.3%", desc: "Percentage of total installed grid capacity sourced from solar, wind, biomass, and hydro energy." },
    birth_rate_index: { label: "Birth Rate Index", fmt: v => v.toFixed(1), min: 8, max: 25, unit: " per 1,000", slices: null, reverse: true, worldAvg: "16.3", desc: "Annual number of live births per 1,000 mid-year population." },
    aqi: { label: "Air Quality Index (AQI)", fmt: v => Math.round(v), min: 30, max: 200, unit: "", slices: null, reverse: true, worldAvg: "38", desc: "Air Quality Index mapping key pollutants (PM2.5, PM10) to health risk levels." }
};

// STATE SHORT NAME MAPPING FOR CLEAR LABELS ON MAP
const STATE_SHORT_NAMES = {
    "Andhra Pradesh": "Andhra",
    "Arunachal Pradesh": "Arunachal",
    "Assam": "Assam",
    "Bihar": "Bihar",
    "Chhattisgarh": "CG",
    "Goa": "Goa",
    "Gujarat": "Gujarat",
    "Haryana": "Haryana",
    "Himachal Pradesh": "Himachal",
    "Jharkhand": "Jharkhand",
    "Karnataka": "Karnataka",
    "Kerala": "Kerala",
    "Madhya Pradesh": "Madhya Pradesh",
    "Maharashtra": "Maharashtra",
    "Manipur": "Manipur",
    "Meghalaya": "Meghalaya",
    "Mizoram": "Mizoram",
    "Nagaland": "Nagaland",
    "Odisha": "Odisha",
    "Punjab": "Punjab",
    "Rajasthan": "Rajasthan",
    "Sikkim": "Sikkim",
    "Tamil Nadu": "Tamil Nadu",
    "Telangana": "Telangana",
    "Tripura": "Tripura",
    "Uttar Pradesh": "Uttar Pradesh",
    "Uttarakhand": "Uttarakhand",
    "West Bengal": "Bengal",
    "Andaman and Nicobar Islands": "A&N Islands",
    "Chandigarh": "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu": "DNHDD",
    "Delhi": "Delhi",
    "Jammu and Kashmir": "J&K",
    "Ladakh": "Ladakh",
    "Lakshadweep": "Lakshadweep",
    "Puducherry": "Puducherry"
};
// ==========================================
// VISUAL DESIGN HELPER UTILITIES
// ==========================================
function getMetricCategoryColor(metricKey) {
    const catCoreQuality = ["life_index", "literacy_rate", "aqi", "water_quality_score", "water_scarcity_index"];
    const catSocioEconomics = ["per_capita_gsdp", "unemployment_rate", "equality_index", "internet_penetration", "clean_cooking_fuel"];
    const catHealthDemographics = ["infant_mortality_rate", "birth_rate_index", "child_stunting_rate", "crime_against_women", "crime_against_minorities"];
    const catEducationInfra = ["gov_schools_percentage", "pupil_teacher_ratio", "school_infrastructure_score"];
    const catSustainability = ["forest_cover_percentage", "sanitation_score", "renewable_energy_share"];

    if (catCoreQuality.includes(metricKey)) return { primary: "#f43f5e", secondary: "rgba(244, 63, 94, 0.08)" };
    if (catSocioEconomics.includes(metricKey)) return { primary: "#0ea5e9", secondary: "rgba(14, 165, 233, 0.08)" };
    if (catHealthDemographics.includes(metricKey)) return { primary: "#e11d48", secondary: "rgba(225, 29, 72, 0.08)" };
    if (catEducationInfra.includes(metricKey)) return { primary: "#f59e0b", secondary: "rgba(245, 158, 11, 0.08)" };
    if (catSustainability.includes(metricKey)) return { primary: "#10b981", secondary: "rgba(16, 185, 129, 0.08)" };
    return { primary: "#ec4899", secondary: "rgba(236, 72, 153, 0.08)" };
}

function formatInsightText(text) {
    if (!text) return "No data logged.";
    
    // Split into sentences, filtering out any empty strings
    const sentences = text.split(/\.\s+/).map(s => s.trim()).filter(s => s.length > 0);
    
    // Extract tags based on keywords in the entire text
    const tags = [];
    const lower = text.toLowerCase();
    
    // Categorize and add tags
    if (lower.includes("education") || lower.includes("literacy") || lower.includes("school") || lower.includes("teacher") || lower.includes("pupil")) {
        tags.push("EDUCATION");
    }
    if (lower.includes("environment") || lower.includes("forest") || lower.includes("green") || lower.includes("renewable") || lower.includes("solar") || lower.includes("organic") || lower.includes("nature")) {
        tags.push("ENVIRONMENT");
    }
    if (lower.includes("legislation") || lower.includes("policy") || lower.includes("fund") || lower.includes("cabinet") || lower.includes("order") || lower.includes("commission") || lower.includes("rule") || lower.includes("mandate")) {
        tags.push("LEGISLATION");
    }
    if (lower.includes("economy") || lower.includes("gsdp") || lower.includes("gdp") || lower.includes("unemployment") || lower.includes("financial") || lower.includes("investment") || lower.includes("subsidy")) {
        tags.push("ECONOMY");
    }
    if (lower.includes("health") || lower.includes("mortality") || lower.includes("stunting") || lower.includes("birth") || lower.includes("maternity") || lower.includes("nutrition")) {
        tags.push("HEALTH");
    }
    if (lower.includes("air") || lower.includes("aqi") || lower.includes("pollution") || lower.includes("smog") || lower.includes("emissions")) {
        tags.push("AIR QUALITY");
    }
    if (lower.includes("water") || lower.includes("filtration") || lower.includes("aquifer") || lower.includes("drinking")) {
        tags.push("WATER");
    }
    if (lower.includes("infrastructure") || lower.includes("fiber") || lower.includes("building") || lower.includes("corridor") || lower.includes("pipeline")) {
        tags.push("INFRASTRUCTURE");
    }
    
    if (tags.length === 0) {
        tags.push("MONITOR");
    }

    // Build tags HTML
    const tagsHtml = tags.map(t => {
        const cleanTag = t.toLowerCase().replace(" ", "-");
        return `<span class="insight-tag tag-${cleanTag}">${t}</span>`;
    }).join("");

    // Build sentences with bold numbers and bullet items
    const bulletItems = sentences.map(sentence => {
        // Ensure sentence ends with a period
        let cleanSentence = sentence;
        if (!cleanSentence.endsWith(".")) {
            cleanSentence += ".";
        }
        // Bold percentage rates, indexes, currency amounts, and count values
        const formatted = cleanSentence.replace(/(\d+[\d,.]*%\s*|\b\d+[\d,.]*\b|\b\d+\s+lakh\b|\b\d+\s+GW\b|₹\d+[\d,.]*)/g, "<strong>$1</strong>");
        return `<li class="insight-bullet-item"><span class="bullet-marker"></span><span class="bullet-text">${formatted}</span></li>`;
    }).join("");

    return `
        <div class="insight-container-rich">
            <div class="insight-tags-row">${tagsHtml}</div>
            <ul class="insight-bullets">${bulletItems}</ul>
        </div>
    `;
}
// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    lucide.createIcons();

    document.getElementById("refresh-aqi-btn").addEventListener("click", triggerAqiSync);
    const playBtn = document.getElementById("play-btn");
    if (playBtn) {
        playBtn.addEventListener("click", togglePlay);
    }

    // Initialize Map
    initMap();

    // Fetch and Load Data
    await loadMetadata();
    await loadDashboardData();
    
    map.on('zoomend', handleMapZoomChange);

    // Responsive window resize & orientation change handler
    let resizeTimer = null;
    const handleViewportResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (map) {
                map.invalidateSize();
                handleMapZoomChange();
            }
        }, 150);
    };
    window.addEventListener("resize", handleViewportResize);
    window.addEventListener("orientationchange", () => {
        setTimeout(handleViewportResize, 250);
    });
});

// ==========================================
// MAP & VISUAL CONTROLLER
// ==========================================
function initMap() {
    const isMobile = window.innerWidth < 768;
    const mobileCenter = [22.4, 79.5];
    const mobileZoom = window.innerWidth < 420 ? 3.8 : 4.0;
    map = L.map("map", {
        zoomSnap: 0.1,
        zoomDelta: 0.5,
        minZoom: 3,
        maxZoom: 8,
        attributionControl: false,
        zoomControl: false
    }).setView(isMobile ? mobileCenter : [22.1, 78.5], isMobile ? mobileZoom : 4.4);
    
    L.control.zoom({ position: 'topright' }).addTo(map);
}

// Normalize state names to match database records
function normalizeStateName(name) {
    if (!name) return "";
    let clean = name.replace(/[&]/g, "and")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toLowerCase();
    
    if (clean.includes("delhi")) return "delhi";
    if (clean.includes("andaman")) return "andaman and nicobar islands";
    if (clean.includes("daman") || clean.includes("dadra")) return "dadra and nagar haveli and daman and diu";
    if (clean.includes("jammu")) return "jammu and kashmir";
    if (clean.includes("orissa") || clean.includes("odisha")) return "odisha";
    if (clean.includes("pondicherry") || clean.includes("puducherry")) return "puducherry";
    return clean;
}

// Helper: Interpolate smoothly across multiple hex color stops (0.0 to 1.0)
function interpolateHexStops(pct, hexStops) {
    const clamped = Math.max(0, Math.min(1, pct));
    const numSegments = hexStops.length - 1;
    const scaled = clamped * numSegments;
    const idx = Math.min(Math.floor(scaled), numSegments - 1);
    const t = scaled - idx;

    const hexToRgb = (hex) => {
        const clean = hex.replace("#", "");
        return [
            parseInt(clean.substring(0, 2), 16),
            parseInt(clean.substring(2, 4), 16),
            parseInt(clean.substring(4, 6), 16)
        ];
    };

    const [r1, g1, b1] = hexToRgb(hexStops[idx]);
    const [r2, g2, b2] = hexToRgb(hexStops[idx + 1]);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `rgb(${r}, ${g}, ${b})`;
}

// Helper: Compute dynamic min & max from active state dataset for high visual contrast
function getDynamicMetricRange(metricKey) {
    const config = METRICS_CONFIG[metricKey] || { min: 0, max: 100 };
    if (!nationalData || !nationalData.states || nationalData.states.length === 0) {
        return { min: config.min, max: config.max };
    }
    const dbKey = (metricKey === selectedMetric) ? getSelectedMetricDbKey() : metricKey;
    const vals = nationalData.states
        .map(s => s[dbKey])
        .filter(v => v !== null && v !== undefined && !isNaN(v));
    if (vals.length < 2) {
        return { min: config.min, max: config.max };
    }
    const actualMin = Math.min(...vals);
    const actualMax = Math.max(...vals);
    if (actualMax <= actualMin) {
        return { min: config.min, max: config.max };
    }
    return { min: actualMin, max: actualMax };
}

// Generate rich multi-stop color gradients based on metric category
function getChoroplethColor(value, metricKey) {
    if (value === undefined || value === null) return "#1e293b"; // Dark slate for missing data
    
    const { min, max } = getDynamicMetricRange(metricKey);
    let pct = (value - min) / (max - min);
    pct = Math.max(0, Math.min(1, pct));

    if (metricKey === "aqi") {
        // Green -> Yellow -> Orange -> Deep Red
        return interpolateHexStops(pct, ["#34d399", "#facc15", "#f97316", "#b91c1c"]);
    }

    // Categories definition:
    const catCoreQuality = ["life_index", "literacy_rate", "water_quality_score", "water_scarcity_index"];
    const catSocioEconomics = ["per_capita_gsdp", "unemployment_rate", "equality_index", "internet_penetration", "clean_cooking_fuel"];
    const catHealthDemographics = ["infant_mortality_rate", "birth_rate_index", "child_stunting_rate", "crime_against_women", "crime_against_minorities"];
    const catEducationInfra = ["gov_schools_percentage", "pupil_teacher_ratio", "school_infrastructure_score"];
    const catSustainability = ["forest_cover_percentage", "sanitation_score", "renewable_energy_share"];

    if (catCoreQuality.includes(metricKey)) {
        // Core Quality: Yellow = Better (1.0), Orange = Mid (0.5), Crimson Red = Worst (0.0)
        const config = METRICS_CONFIG[metricKey];
        const goodness = (config && config.reverse) ? (1 - pct) : pct;
        return interpolateHexStops(goodness, ["#b91c1c", "#f97316", "#fde047"]);
    } else if (catSocioEconomics.includes(metricKey)) {
        // Light Sky Blue -> Vivid Dark Blue -> Deep Purple
        return interpolateHexStops(pct, ["#7dd3fc", "#1d4ed8", "#581c87"]);
    } else if (catHealthDemographics.includes(metricKey)) {
        // Light Pink -> Warm Rose Pink -> Deep Pinkish Red (no purple)
        return interpolateHexStops(pct, ["#fce7f3", "#f472b6", "#e11d48", "#9f1239"]);
    } else if (catEducationInfra.includes(metricKey)) {
        // Pale Yellow -> Warm Amber/Orange -> Deep Rust Red
        return interpolateHexStops(pct, ["#fef08a", "#f59e0b", "#991b1b"]);
    } else if (catSustainability.includes(metricKey)) {
        // Light Lime Yellow-Green -> Vibrant Emerald -> Deep Teal/Forest
        return interpolateHexStops(pct, ["#d9f99d", "#10b981", "#064e3b"]);
    }
    
    return interpolateHexStops(pct, ["#b91c1c", "#f97316", "#fde047"]);
}

function updateMap() {
    if (!geoJsonData || !nationalData) return;

    const metricKey = getSelectedMetricDbKey();
    const config = METRICS_CONFIG[selectedMetric];

    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
    }

    const stateMetrics = {};
    nationalData.states.forEach(s => {
        stateMetrics[normalizeStateName(s.name)] = s[metricKey];
    });

    geoJsonLayer = L.geoJson(geoJsonData, {
        style: (feature) => {
            const stateName = normalizeStateName(feature.properties.NAME || feature.properties.ST_NM);
            const val = stateMetrics[stateName];
            
            // Check if selected in comparison mode
            const stateId = getStateIdFromProperties(feature.properties);
            let borderCol = "rgba(15, 23, 42, 0.55)"; // crisp dark contrast border between states
            let weight = 1.1;
            
            if (compareModeActive) {
                if (stateId === selectedStateAId) {
                    borderCol = "#0ea5e9"; // Cyan outline for A
                    weight = 2.5;
                } else if (stateId === selectedStateBId) {
                    borderCol = "#8b5cf6"; // Violet outline for B
                    weight = 2.5;
                }
            } else if (selectedStateId !== null && stateId === selectedStateId) {
                borderCol = "#ffffff"; // High-contrast white outline for selected state
                weight = 2.8;
            }

            return {
                fillColor: getChoroplethColor(val, selectedMetric),
                weight: weight,
                opacity: 1,
                color: borderCol,
                fillOpacity: 0.92
            };
        },
        onEachFeature: (feature, layer) => {
            const stateNameOriginal = feature.properties.NAME || feature.properties.ST_NM;
            const stateNameNormalized = normalizeStateName(stateNameOriginal);
            const dbState = nationalData.states.find(s => normalizeStateName(s.name) === stateNameNormalized);
            const val = dbState ? dbState[metricKey] : null;
            const formattedVal = val !== null ? config.fmt(val) : "--";

            // Centroid short label on map (permanent tooltip)
            if (dbState) {
                const shortName = STATE_SHORT_NAMES[dbState.name] || dbState.name;
                const catColors = getMetricCategoryColor(selectedMetric);
                const valHtml = showMapNumbers ? `<span class="label-val">${formattedVal}</span>` : ``;
                layer.bindTooltip(`
                    <div class="label-container" style="--label-glow: ${catColors.primary}">
                        <span class="label-name">${shortName}</span>
                        ${valHtml}
                    </div>
                `, {
                    permanent: true,
                    direction: "center",
                    className: "state-map-label"
                });
            }

            // Map interactions
            layer.on({
                mouseover: (e) => {
                    const l = e.target;
                    l.setStyle({
                        fillOpacity: 1.0,
                        weight: 2.4,
                        color: "#ffffff"
                    });
                    
                    // Force reveal tooltip when zoomed out
                    const tooltip = l.getTooltip();
                    if (tooltip) {
                        const el = tooltip.getElement();
                        if (el) {
                            el.classList.add("tooltip-hover-visible");
                        }
                    }
                    
                    if (!compareModeActive && selectedStateId === null && dbState) {
                        highlightRankingRow(dbState.id);
                    }
                },
                mouseout: (e) => {
                    geoJsonLayer.resetStyle(e.target);
                    
                    const tooltip = e.target.getTooltip();
                    if (tooltip) {
                        const el = tooltip.getElement();
                        if (el) {
                            el.classList.remove("tooltip-hover-visible");
                        }
                    }
                    
                    if (!compareModeActive && selectedStateId === null) {
                        clearRankingHighlight();
                    }
                },
                click: () => {
                    if (dbState) {
                        handleStateClick(dbState.id);
                    }
                }
            });
        }
    }).addTo(map);

    handleMapZoomChange();
    updateLegend();
}

// Helper to resolve state ID from geojson properties
function getStateIdFromProperties(properties) {
    if (!nationalData) return null;
    const name = normalizeStateName(properties.NAME || properties.ST_NM);
    const dbState = nationalData.states.find(s => normalizeStateName(s.name) === name);
    return dbState ? dbState.id : null;
}

function updateLegend() {
    const legend = document.getElementById("map-legend");
    legend.innerHTML = "";
    
    const config = METRICS_CONFIG[selectedMetric];
    const { min, max } = getDynamicMetricRange(selectedMetric);
    
    const title = document.createElement("div");
    title.className = "legend-title";
    title.innerText = config.unit ? `${config.label} (${config.unit.trim()})` : config.label;
    legend.appendChild(title);
    
    const bar = document.createElement("div");
    bar.className = "legend-color-bar";
    
    const c1 = getChoroplethColor(min, selectedMetric);
    const c2 = getChoroplethColor(min + (max - min) * 0.25, selectedMetric);
    const c3 = getChoroplethColor(min + (max - min) * 0.5, selectedMetric);
    const c4 = getChoroplethColor(min + (max - min) * 0.75, selectedMetric);
    const c5 = getChoroplethColor(max, selectedMetric);
    bar.style.background = `linear-gradient(to right, ${c1}, ${c2}, ${c3}, ${c4}, ${c5})`;
    
    legend.appendChild(bar);
    
    const labels = document.createElement("div");
    labels.className = "legend-labels";
    labels.innerHTML = `
        <span>${config.fmt(min)}</span>
        <span>${config.fmt(min + (max - min) / 2)}</span>
        <span>${config.fmt(max)}</span>
    `;
    legend.appendChild(labels);
}

function handleMapZoomChange() {
    if (!map) return;
    const zoom = map.getZoom();
    const isMobile = window.innerWidth < 768;
    const minZoom = isMobile ? 3.2 : 4.2;
    const mapElement = document.getElementById("map");
    if (!showMapNumbers || zoom < minZoom) {
        mapElement.classList.add("leaflet-zoom-hide-labels");
    } else {
        mapElement.classList.remove("leaflet-zoom-hide-labels");
    }
}

// ==========================================
// DATA LOADING & ROUTER
// ==========================================
async function loadMetadata() {
    try {
        const res = await fetch("/api/metadata");
        if (res.ok) {
            metadataData = await res.json();
        }
    } catch (e) {
        console.error("Failed to load metadata: ", e);
    }
}

async function loadDashboardData() {
    try {
        let url = `/api/overview?year=${activeYear}`;
        if (selectedMetric === 'aqi') {
            url = `/api/overview?year=2025&month=${activeMonth}&day=${activeDay}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error("API Overview failed");
        nationalData = await res.json();
        
        // Load GeoJSON if not cached
        if (!geoJsonData) {
            const geoRes = await fetch("/static/india_states.geojson");
            if (geoRes.ok) {
                geoJsonData = await geoRes.json();
            } else {
                console.error("Local GeoJSON file missing or unreadable.");
            }
        }

        checkAqiSystemStatus();
        updateTimelineVisibility();
        refreshActiveView();
        updateMap();
    } catch (e) {
        console.error("Error loading dashboard metrics: ", e);
    }
}

function updateTimelineVisibility() {
    const yearlyContainer = document.getElementById("yearly-player-container");
    const aqiContainer = document.getElementById("aqi-player-container");
    const yearlyDisplay = document.getElementById("timeline-year-display");
    const aqiDisplay = document.getElementById("timeline-aqi-display");
    
    if (selectedMetric === 'aqi') {
        yearlyContainer.classList.add("hidden");
        yearlyDisplay.classList.add("hidden");
        aqiContainer.classList.remove("hidden");
        aqiDisplay.classList.remove("hidden");
        
        const monthSelect = document.getElementById("aqi-month-select");
        const monthName = monthSelect.options[monthSelect.selectedIndex]?.text || "June";
        const shortMonthName = monthName.substring(0, 3);
        
        const daysCount = getDaysInMonth(activeMonth, activeYear);
        const daySlider = document.getElementById("aqi-day-slider");
        if (daySlider) {
            daySlider.max = daysCount;
            if (parseInt(daySlider.value) > daysCount) {
                daySlider.value = daysCount;
                activeDay = daysCount;
            }
        }
        const maxDayLabel = document.getElementById("aqi-max-day-label");
        if (maxDayLabel) {
            maxDayLabel.innerText = `Day ${daysCount}`;
        }
        
        aqiDisplay.innerText = `${shortMonthName} ${activeDay}`;
    } else {
        yearlyContainer.classList.remove("hidden");
        yearlyDisplay.classList.remove("hidden");
        aqiContainer.classList.add("hidden");
        aqiDisplay.classList.add("hidden");
        
        yearlyDisplay.innerText = activeYear;
    }
}

function checkAqiSystemStatus() {
    if (!nationalData || !nationalData.states) return;
    
    const staleState = nationalData.states.find(s => s.aqi_status === 'stale_fallback');
    const badge = document.getElementById("connection-badge");
    const warningBanner = document.getElementById("aqi-fallback-warning");
    
    if (staleState) {
        badge.className = "status-badge warning";
        badge.querySelector(".badge-text").innerText = "AQI: Fallback Cache";
        
        warningBanner.classList.remove("hidden");
        const lastUpdated = staleState.aqi_last_updated ? new Date(staleState.aqi_last_updated).toLocaleString() : "Unknown";
        document.getElementById("fallback-timestamp").innerText = lastUpdated;
    } else {
        badge.className = "status-badge active";
        badge.querySelector(".badge-text").innerText = "AQI: Connected";
        warningBanner.classList.add("hidden");
    }
}

function getSelectedMetricDbKey() {
    if (!METRICS_CONFIG[selectedMetric].slices) return selectedMetric;
    if (selectedSlice === "overall") return selectedMetric;
    return `${selectedMetric}_${selectedSlice}`;
}

// Router to swap views based on active selections
function refreshActiveView() {
    updateTransparencyPanel();
    updateTimelineVisibility();
    
    // Set brand color globally on :root
    const catColors = getMetricCategoryColor(selectedMetric);
    document.documentElement.style.setProperty("--brand-color", catColors.primary);
    document.documentElement.style.setProperty("--brand-color-alpha", catColors.secondary);
    
    // Also style the insights panel box specifically
    const insightsPanel = document.getElementById("insights-panel-box");
    if (insightsPanel) {
        insightsPanel.style.setProperty("--brand-color", catColors.primary);
        insightsPanel.style.setProperty("--brand-color-alpha", catColors.secondary);
    }
    
    // Update metric description
    const defTextEl = document.getElementById("insight-definition-text");
    const config = METRICS_CONFIG[selectedMetric];
    if (defTextEl && config) {
        defTextEl.innerText = config.desc || "Definition not logged.";
    }
    
    // Update year displays across DOM headers
    document.querySelectorAll(".active-year-text").forEach(el => {
        el.innerText = activeYear;
    });
    
    if (compareModeActive) {
        // View 3: Compare
        document.getElementById("view-national").classList.remove("active");
        document.getElementById("view-state").classList.remove("active");
        document.getElementById("view-compare").classList.add("active");
        renderCompareView();
    } else if (selectedStateId === null) {
        // View 1: National
        document.getElementById("view-state").classList.remove("active");
        document.getElementById("view-compare").classList.remove("active");
        document.getElementById("view-national").classList.add("active");
        renderNationalMetricsGrid();
        renderRankingList();
        loadStateInsights(0, selectedMetric); // Load national general facts
    } else {
        // View 2: State
        document.getElementById("view-national").classList.remove("active");
        document.getElementById("view-compare").classList.remove("active");
        document.getElementById("view-state").classList.add("active");
        loadStateDetailData();
    }
}

function updateTransparencyPanel() {
    if (!metadataData) return;
    const meta = metadataData[selectedMetric];
    
    if (meta) {
        document.getElementById("meta-source").innerText = meta.source_name;
        document.getElementById("meta-pub-year").innerText = meta.publication_year;
        document.getElementById("meta-last-refresh").innerText = meta.last_refresh_time ? new Date(meta.last_refresh_time).toLocaleString() : "Live";
        document.getElementById("meta-next-release").innerText = meta.next_release_expected;
    }
}

// ==========================================
// VIEW 1: NATIONAL OVERVIEW
// ==========================================
function renderNationalMetricsGrid() {
    const grid = document.getElementById("national-metrics-grid");
    grid.innerHTML = "";
    
    if (!nationalData) return;
    
    Object.keys(METRICS_CONFIG).forEach(key => {
        const config = METRICS_CONFIG[key];
        const isAqi = (key === 'aqi');
        
        let avgKey = key;
        if (config.slices && key === selectedMetric) {
            avgKey = getSelectedMetricDbKey();
        }
        
        const avgVal = nationalData.averages[avgKey];
        if (avgVal === undefined || avgVal === null) return;
        
        const card = document.createElement("div");
        card.className = `profile-card ${key === selectedMetric ? 'active-metric-kpi' : ''} ${isAqi ? 'aqi-active' : ''}`;
        card.onclick = () => {
            selectedMetric = key;
            document.getElementById("metric-select").value = key;
            handleMetricChange();
        };
        
        if (isAqi) {
            const pm2_5 = nationalData.averages["pm2_5"] || 0;
            const pm10 = nationalData.averages["pm10"] || 0;
            card.innerHTML = `
                <div class="profile-title">${config.label}</div>
                <div class="aqi-compact-row">
                    <div class="profile-value-row">
                        <div class="profile-value" style="color: ${getChoroplethColor(avgVal, 'aqi')}">${config.fmt(avgVal)}</div>
                        <span class="profile-comparison neutral">National Avg</span>
                    </div>
                    <div class="aqi-right-col">
                        <div class="aqi-sub-line"><span class="val">${pm2_5.toFixed(0)}</span> <span class="lbl">PM2.5</span></div>
                        <div class="aqi-sub-line"><span class="val">${pm10.toFixed(0)}</span> <span class="lbl">PM10</span></div>
                    </div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="profile-title">${config.label}</div>
                <div class="aqi-compact-row">
                    <div class="profile-value-row">
                        <div class="profile-value">${config.fmt(avgVal)}</div>
                        <span class="profile-comparison neutral">National Avg</span>
                    </div>
                    <div class="world-avg-col">
                        <div class="world-avg-val">${config.worldAvg || "—"}</div>
                        <span class="world-avg-lbl">World Avg</span>
                    </div>
                </div>
            `;
        }
        
        grid.appendChild(card);
    });
}

function renderRankingList() {
    const listContainer = document.getElementById("ranking-list-items");
    listContainer.innerHTML = "";
    
    if (!nationalData) return;

    const metricKey = getSelectedMetricDbKey();
    const config = METRICS_CONFIG[selectedMetric];
    const statesWithVal = nationalData.states.filter(s => s[metricKey] !== null);
    
    const reverseScale = config.reverse || false;
    statesWithVal.sort((a, b) => {
        return reverseScale ? a[metricKey] - b[metricKey] : b[metricKey] - a[metricKey];
    });

    document.getElementById("ranking-title").innerText = `${config.label} State Rankings (Best to Worst)`;

    statesWithVal.forEach((state, idx) => {
        const item = document.createElement("li");
        item.className = "ranking-item";
        item.id = `rank-row-${state.id}`;
        item.onclick = () => selectState(state.id);
        
        item.innerHTML = `
            <div class="rank-info">
                <span class="rank-badge">${idx + 1}</span>
                <span class="rank-name">${state.name}</span>
            </div>
            <span class="rank-val" style="color: ${getChoroplethColor(state[metricKey], selectedMetric)}">${config.fmt(state[metricKey])}</span>
        `;
        listContainer.appendChild(item);
    });
}

function highlightRankingRow(stateId) {
    clearRankingHighlight();
    const element = document.getElementById(`rank-row-${stateId}`);
    if (element) {
        element.classList.add("selected-state-rank");
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function clearRankingHighlight() {
    const items = document.querySelectorAll(".ranking-item");
    items.forEach(item => item.classList.remove("selected-state-rank"));
}

// ==========================================
// VIEW 2: STATE DEEP DIVE & CURATED INSIGHTS
// ==========================================
async function loadStateDetailData() {
    if (selectedStateId === null) return;
    
    try {
        const res = await fetch(`/api/state/${selectedStateId}`);
        if (!res.ok) throw new Error("Failed to fetch state details");
        const data = await res.json();
        
        // 1. Populate Header info
        document.getElementById("state-detail-name").innerText = data.profile.name;
        document.getElementById("state-detail-capital").innerText = data.profile.capital;
        
        // 2. Render comparative metrics grid
        renderStateMetricsGrid(data);
        
        // 3. Load dynamic state insights (Fact and News Dialogue Box)
        loadStateInsights(selectedStateId, selectedMetric);
        
        // 4. Render charts
        renderTrendChart(data);
        renderComparisonChart(data);
    } catch (e) {
        console.error("Error loading state details: ", e);
    }
}

async function loadStateInsights(stateId, metricKey) {
    try {
        const res = await fetch(`/api/insight/${stateId}/${metricKey}`);
        if (res.ok) {
            const data = await res.json();
            document.getElementById("insight-fact-text").innerHTML = formatInsightText(data.fact);
            document.getElementById("insight-news-text").innerHTML = formatInsightText(data.news);
            
            // Dynamic Header Title in insights box
            const config = METRICS_CONFIG[metricKey];
            const headerTitle = document.querySelector("#insights-panel-box .insights-header h3");
            if (headerTitle && config) {
                const stateName = (stateId === 0) ? "National" : (nationalData?.states.find(s => s.id === stateId)?.name || "State");
                headerTitle.innerText = `${config.label} - ${stateName} Insights`;
            }
        } else {
            document.getElementById("insight-fact-text").innerHTML = "No specific facts logged for this combination.";
            document.getElementById("insight-news-text").innerHTML = "No active news logged for this combination.";
        }
    } catch (e) {
        console.error("Failed to load insights: ", e);
    }
}

function renderStateMetricsGrid(data) {
    const grid = document.getElementById("state-metrics-grid");
    grid.innerHTML = "";

    // Find the metrics matching the active timeline year
    const activeYearMetrics = data.history.find(h => h.year === activeYear) || data.history[data.history.length - 1];
    if (!activeYearMetrics) return;

    Object.keys(METRICS_CONFIG).forEach(key => {
        const config = METRICS_CONFIG[key];
        let value = null;
        let natAvg = null;
        let isAqi = (key === 'aqi');

        if (isAqi) {
            value = data.aqi ? data.aqi.aqi : null;
            natAvg = nationalData ? nationalData.averages["aqi"] : 0;
        } else {
            let statKey = key;
            if (config.slices && key === selectedMetric) {
                statKey = getSelectedMetricDbKey();
            }
            value = activeYearMetrics[statKey];
            natAvg = nationalData ? nationalData.averages[statKey] : 0;
        }

        if (value === null || value === undefined) return;

        const isBetter = config.reverse ? (value < natAvg) : (value > natAvg);
        const diff = value - natAvg;
        const diffPercent = natAvg !== 0 ? (diff / natAvg * 100) : 0;
        
        let compClass = "neutral";
        let compText = "—";
        
        if (Math.abs(diff) > 0.01) {
            compClass = isBetter ? "above" : "below";
            compText = `${isBetter ? '↑' : '↓'} ${Math.abs(diffPercent).toFixed(0)}%`;
        }

        const card = document.createElement("div");
        card.className = `profile-card ${key === selectedMetric ? 'active-metric-kpi' : ''} ${isAqi ? 'aqi-active' : ''}`;
        card.onclick = () => {
            selectedMetric = key;
            document.getElementById("metric-select").value = key;
            handleMetricChange();
        };
        
        if (isAqi) {
            const pm2_5 = data.aqi ? data.aqi.pm2_5 : 0;
            const pm10 = data.aqi ? data.aqi.pm10 : 0;
            const statusText = data.aqi ? (data.aqi.status === 'active' ? 'Live' : 'Stale') : 'Unknown';
            
            card.innerHTML = `
                <div class="profile-title">${config.label} (${statusText})</div>
                <div class="aqi-compact-row">
                    <div class="profile-value-row">
                        <div class="profile-value" style="color: ${getChoroplethColor(value, 'aqi')}">${config.fmt(value)}</div>
                        <span class="profile-comparison ${compClass}">${compText}</span>
                    </div>
                    <div class="aqi-right-col">
                        <div class="aqi-sub-line"><span class="val">${pm2_5.toFixed(0)}</span> <span class="lbl">PM2.5</span></div>
                        <div class="aqi-sub-line"><span class="val">${pm10.toFixed(0)}</span> <span class="lbl">PM10</span></div>
                    </div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="profile-title">${config.label}</div>
                <div class="aqi-compact-row">
                    <div class="profile-value-row">
                        <div class="profile-value">${config.fmt(value)}</div>
                        <span class="profile-comparison ${compClass}">${compText}</span>
                    </div>
                    <div class="world-avg-col">
                        <div class="world-avg-val">${config.worldAvg || "—"}</div>
                        <span class="world-avg-lbl">World Avg</span>
                    </div>
                </div>
            `;
        }
        
        grid.appendChild(card);
    });
}



function renderTrendChart(data) {
    const ctx = document.getElementById("chart-history").getContext("2d");
    const metricDbKey = getSelectedMetricDbKey();
    const config = METRICS_CONFIG[selectedMetric];

    if (charts["history"]) {
        charts["history"].destroy();
    }

    const catColors = getMetricCategoryColor(selectedMetric);

    if (selectedMetric === 'aqi') {
        charts["history"] = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["PM2.5", "PM10", "US-AQI"],
                datasets: [{
                    data: [data.aqi?.pm2_5 || 0, data.aqi?.pm10 || 0, data.aqi?.aqi || 0],
                    backgroundColor: ["#0ea5e9", "#8b5cf6", getChoroplethColor(data.aqi?.aqi || 0, 'aqi')]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "rgba(9, 13, 31, 0.95)",
                        titleFont: { family: "'Outfit', sans-serif", size: 12, weight: '700' },
                        bodyFont: { family: "'Inter', sans-serif", size: 12 },
                        borderColor: "rgba(255, 255, 255, 0.08)",
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 10,
                        displayColors: false
                    }
                },
                scales: { 
                    y: { 
                        grid: { color: "rgba(255,255,255,0.04)" },
                        ticks: { font: { family: "'Outfit', 'Inter', sans-serif", size: 10, weight: '500' }, color: "#94a3b8" }
                    },
                    x: {
                        ticks: { font: { family: "'Outfit', 'Inter', sans-serif", size: 10, weight: '500' }, color: "#94a3b8" }
                    }
                }
            }
        });
        return;
    }

    const labels = data.history.map(h => h.year.toString());
    const datasetVal = data.history.map(h => h[metricDbKey]);

    // Create linear canvas gradient fills under the trend line
    const gradient = ctx.createLinearGradient(0, 0, 0, 170);
    gradient.addColorStop(0, catColors.primary + "5A"); // ~35% opacity
    gradient.addColorStop(0.6, catColors.primary + "15"); // ~8% opacity
    gradient.addColorStop(1, catColors.primary + "00"); // 0% opacity

    charts["history"] = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: data.profile.name,
                data: datasetVal,
                borderColor: catColors.primary,
                backgroundColor: gradient,
                fill: true,
                tension: 0.3,
                borderWidth: 2,
                pointBackgroundColor: catColors.primary,
                pointBorderColor: "#ffffff",
                pointBorderWidth: 1.5,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: catColors.primary,
                pointHoverBorderColor: "#ffffff",
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: "rgba(9, 13, 31, 0.95)",
                    titleFont: { family: "'Outfit', sans-serif", size: 12, weight: '700' },
                    bodyFont: { family: "'Inter', sans-serif", size: 12 },
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 10,
                    displayColors: false
                }
            },
            scales: {
                x: { 
                    grid: { display: false }, 
                    ticks: { font: { family: "'Outfit', 'Inter', sans-serif", size: 10, weight: '500' }, color: "#94a3b8" }
                },
                y: { 
                    grid: { color: "rgba(255,255,255,0.04)" }, 
                    ticks: { font: { family: "'Outfit', 'Inter', sans-serif", size: 10, weight: '500' }, color: "#94a3b8" }
                }
            }
        }
    });
}

function renderComparisonChart(data) {
    const ctx = document.getElementById("chart-comparison").getContext("2d");
    const metricDbKey = getSelectedMetricDbKey();

    if (charts["comparison"]) {
        charts["comparison"].destroy();
    }

    let stateVal = null;
    let nationalAvg = null;

    if (selectedMetric === 'aqi') {
        stateVal = data.aqi ? data.aqi.aqi : 0;
        nationalAvg = nationalData ? nationalData.averages["aqi"] : 0;
    } else {
        const latest = data.history.find(h => h.year === activeYear) || data.history[data.history.length - 1];
        stateVal = latest ? latest[metricDbKey] : 0;
        nationalAvg = nationalData ? nationalData.averages[metricDbKey] : 0;
    }

    const catColors = getMetricCategoryColor(selectedMetric);

    charts["comparison"] = new Chart(ctx, {
        type: "bar",
        data: {
            labels: [data.profile.name, "National Average"],
            datasets: [{
                data: [stateVal, nationalAvg],
                backgroundColor: [catColors.primary, "#475569"],
                borderWidth: 0,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: "rgba(9, 13, 31, 0.95)",
                    titleFont: { family: "'Outfit', sans-serif", size: 12, weight: '700' },
                    bodyFont: { family: "'Inter', sans-serif", size: 12 },
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 10,
                    displayColors: false
                }
            },
            scales: {
                x: { 
                    grid: { display: false }, 
                    ticks: { font: { family: "'Outfit', 'Inter', sans-serif", size: 10, weight: '500' }, color: "#94a3b8" }
                },
                y: { 
                    grid: { color: "rgba(255,255,255,0.04)" }, 
                    ticks: { font: { family: "'Outfit', 'Inter', sans-serif", size: 10, weight: '500' }, color: "#94a3b8" }
                }
            }
        }
    });
}

// ==========================================
// VIEW 3: DUAL-STATE COMPARISON MODE
// ==========================================
function toggleCompareMode(isActive) {
    compareModeActive = isActive;
    
    // Sync the header toggle checkbox state
    const checkbox = document.getElementById("compare-mode-checkbox");
    if (checkbox) {
        checkbox.checked = isActive;
    }
    
    // Reset all selections
    selectedStateId = null;
    selectedStateAId = null;
    selectedStateBId = null;
    
    // Reset switch label styles if needed
    refreshActiveView();
    updateMap();
}

async function renderCompareView() {
    const tbody = document.getElementById("comparison-table-body");
    tbody.innerHTML = "";
    
    if (charts["compareDual"]) {
        charts["compareDual"].destroy();
    }
    
    const stateANameEl = document.getElementById("table-state-a-name");
    const stateBNameEl = document.getElementById("table-state-b-name");
    const titleEl = document.getElementById("compare-states-names");
    const canvas = document.getElementById("chart-compare-dual");
    const ctx = canvas.getContext("2d");

    // Default label if states are missing
    stateANameEl.innerText = "State A";
    stateBNameEl.innerText = "State B";
    titleEl.innerText = "Select two states on the map to compare";
    
    ctx.clearRect(0,0,300,200);

    if (selectedStateAId === null && selectedStateBId === null) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Please click any state on the map to select State A.</td></tr>`;
        return;
    }
    if (selectedStateBId === null) {
        // Fetch A profile
        const resA = await fetch(`/api/state/${selectedStateAId}`);
        const dataA = await resA.json();
        stateANameEl.innerText = dataA.profile.name;
        titleEl.innerText = `Comparing ${dataA.profile.name} (Select State B)`;
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Click another state on the map to select State B.</td></tr>`;
        return;
    }

    // Both selected: Fetch data
    try {
        const [resA, resB] = await Promise.all([
            fetch(`/api/state/${selectedStateAId}`),
            fetch(`/api/state/${selectedStateBId}`)
        ]);
        const dataA = await resA.json();
        const dataB = await resB.json();
        
        stateANameEl.innerText = dataA.profile.name;
        stateBNameEl.innerText = dataB.profile.name;
        titleEl.innerText = `Comparing ${dataA.profile.name} vs ${dataB.profile.name} (${activeYear})`;
        
        const latestA = dataA.history.find(h => h.year === activeYear) || dataA.history[dataA.history.length - 1];
        const latestB = dataB.history.find(h => h.year === activeYear) || dataB.history[dataB.history.length - 1];
        
        // Populate Table rows of all 20 metrics
        Object.keys(METRICS_CONFIG).forEach(key => {
            const config = METRICS_CONFIG[key];
            let valA = key === 'aqi' ? (dataA.aqi?.aqi ?? null) : (latestA?.[key] ?? null);
            let valB = key === 'aqi' ? (dataB.aqi?.aqi ?? null) : (latestB?.[key] ?? null);
            let avgVal = nationalData?.averages[key] ?? null;
            
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${config.label}</strong></td>
                <td>${valA !== null ? config.fmt(valA) : "--"}</td>
                <td>${valB !== null ? config.fmt(valB) : "--"}</td>
                <td>${avgVal !== null ? config.fmt(avgVal) : "--"}</td>
            `;
            tbody.appendChild(tr);
        });

        // Render dual comparison Chart for selected metric
        const metricKey = getSelectedMetricDbKey();
        const config = METRICS_CONFIG[selectedMetric];
        
        let chartValA = selectedMetric === 'aqi' ? (dataA.aqi?.aqi ?? 0) : (latestA?.[metricKey] ?? 0);
        let chartValB = selectedMetric === 'aqi' ? (dataB.aqi?.aqi ?? 0) : (latestB?.[metricKey] ?? 0);
        let chartAvg = nationalData?.averages[metricKey] ?? 0;

        document.getElementById("chart-compare-bar-title").innerText = `${config.label} Comparison (${activeYear})`;

        charts["compareDual"] = new Chart(ctx, {
            type: "bar",
            data: {
                labels: [dataA.profile.name, dataB.profile.name, "National Average"],
                datasets: [{
                    data: [chartValA, chartValB, chartAvg],
                    backgroundColor: ["#0ea5e9", "#8b5cf6", "#475569"],
                    borderRadius: 6,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "rgba(9, 13, 31, 0.95)",
                        titleFont: { family: "'Outfit', sans-serif", size: 12, weight: '700' },
                        bodyFont: { family: "'Inter', sans-serif", size: 12 },
                        borderColor: "rgba(255, 255, 255, 0.08)",
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 10,
                        displayColors: false
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { font: { family: "'Outfit', 'Inter', sans-serif", size: 10, weight: '500' }, color: "#94a3b8" }
                    },
                    y: { 
                        grid: { color: "rgba(255,255,255,0.04)" }, 
                        ticks: { font: { family: "'Outfit', 'Inter', sans-serif", size: 10, weight: '500' }, color: "#94a3b8" }
                    }
                }
            }
        });

    } catch (e) {
        console.error("Error generating comparison views: ", e);
    }
}

// ==========================================
// STATE CHANGERS & TIME-LAPSE PLAYER
// ==========================================
function handleStateClick(stateId) {
    showMapNumbers = true;
    if (compareModeActive) {
        if (selectedStateAId === null) {
            selectedStateAId = stateId;
        } else if (selectedStateBId === null) {
            if (stateId !== selectedStateAId) {
                selectedStateBId = stateId;
            }
        } else {
            // Reset and start A again
            selectedStateAId = stateId;
            selectedStateBId = null;
        }
        refreshActiveView();
        updateMap();
    } else {
        selectState(stateId);
    }
}

function scrollToStats() {
    const detailsCol = document.querySelector(".details-column");
    if (detailsCol) {
        detailsCol.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function selectState(stateId) {
    showMapNumbers = true;
    selectedStateId = stateId;
    refreshActiveView();
    updateMap();

    // On mobile, smoothly scroll down to reveal state profile & charts
    if (window.innerWidth < 768) {
        setTimeout(() => {
            scrollToStats();
        }, 80);
    }
}

function deselectState() {
    selectedStateId = null;
    selectedStateAId = null;
    selectedStateBId = null;
    refreshActiveView();
    updateMap();

    // On mobile, smoothly return view to map
    if (window.innerWidth < 768) {
        const mapCol = document.querySelector(".map-column");
        if (mapCol) {
            mapCol.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }
}

// Year slider change event
function handleYearSliderChange(year) {
    activeYear = parseInt(year);
    document.getElementById("timeline-year-display").innerText = activeYear;
    loadDashboardData();
}

// Helper to get days in month (handles leap years)
function getDaysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

// AQI Day/Month Picker change event
function handleAqiDateChange() {
    activeMonth = parseInt(document.getElementById("aqi-month-select").value);
    
    const daysCount = getDaysInMonth(activeMonth, activeYear);
    const daySlider = document.getElementById("aqi-day-slider");
    if (daySlider) {
        daySlider.max = daysCount;
        if (parseInt(daySlider.value) > daysCount) {
            daySlider.value = daysCount;
        }
        activeDay = parseInt(daySlider.value);
    } else {
        activeDay = 15;
    }
    
    const maxDayLabel = document.getElementById("aqi-max-day-label");
    if (maxDayLabel) {
        maxDayLabel.innerText = `Day ${daysCount}`;
    }
    
    const monthSelect = document.getElementById("aqi-month-select");
    const monthName = monthSelect.options[monthSelect.selectedIndex]?.text || "June";
    const shortMonthName = monthName.substring(0, 3);
    document.getElementById("timeline-aqi-display").innerText = `${shortMonthName} ${activeDay}`;
    
    loadDashboardData();
}

// Play/Pause timeline loops
function togglePlay() {
    const playBtn = document.getElementById("play-btn");
    
    if (isPlaying) {
        // PAUSE
        clearInterval(playbackTimer);
        isPlaying = false;
        playBtn.innerHTML = `<i data-lucide="play"></i>`;
    } else {
        // PLAY
        isPlaying = true;
        playBtn.innerHTML = `<i data-lucide="pause"></i>`;
        
        playbackTimer = setInterval(() => {
            if (selectedMetric === 'aqi') {
                activeDay++;
                if (activeDay > 28) {
                    activeDay = 1;
                    activeMonth++;
                    if (activeMonth > 12) {
                        activeMonth = 1;
                    }
                    document.getElementById("aqi-month-select").value = activeMonth;
                }
                document.getElementById("aqi-day-slider").value = activeDay;
                
                const monthSelect = document.getElementById("aqi-month-select");
                const monthName = monthSelect.options[monthSelect.selectedIndex]?.text || "June";
                const shortMonthName = monthName.substring(0, 3);
                document.getElementById("timeline-aqi-display").innerText = `${shortMonthName} ${activeDay}`;
            } else {
                activeYear++;
                if (activeYear > 2025) {
                    activeYear = 2021; // Loop back
                }
                document.getElementById("year-slider").value = activeYear;
                document.getElementById("timeline-year-display").innerText = activeYear;
            }
            
            loadDashboardData();
        }, 1800);
    }
    
    lucide.createIcons();
}

// Tab switcher logic
function switchNationalTab(tab) {
    activeNationalTab = tab;
    document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(el => el.classList.remove("active"));
    
    document.getElementById(`tab-btn-${tab}`).classList.add("active");
    document.getElementById(`tab-pane-${tab}`).classList.add("active");
}

async function triggerAqiSync() {
    const btn = document.getElementById("refresh-aqi-btn");
    const originalText = btn.innerHTML;
    
    btn.innerHTML = `<span class="spinner" style="border: 2px solid #334155; border-top: 2px solid #ec4899; border-radius: 50%; width: 12px; height: 12px; display: inline-block; animation: spin 1s linear infinite;"></span>`;
    btn.disabled = true;

    try {
        const res = await fetch("/api/refresh-aqi", { method: "POST" });
        if (res.ok) {
            await new Promise(r => setTimeout(r, 2000));
            await loadDashboardData();
        }
    } catch (e) {
        console.error("Failed to sync AQI data: ", e);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        lucide.createIcons();
    }
}

// ==========================================
// INTERACTIVE GLOBAL CONTROLS
// ==========================================
function handleMetricChange() {
    showMapNumbers = true;
    selectedMetric = document.getElementById("metric-select").value;
    const config = METRICS_CONFIG[selectedMetric];

    const slicerContainer = document.getElementById("slicer-container");
    const slicerPills = document.getElementById("slicer-pills");
    slicerPills.innerHTML = "";

    if (config.slices) {
        slicerContainer.classList.remove("hidden");
        selectedSlice = config.slices[0];
        
        config.slices.forEach(slice => {
            const btn = document.createElement("button");
            btn.className = `slicer-pill ${slice === selectedSlice ? 'active' : ''}`;
            btn.innerText = slice.charAt(0).toUpperCase() + slice.slice(1);
            btn.onclick = () => selectSlicerValue(slice, btn);
            slicerPills.appendChild(btn);
        });
    } else {
        slicerContainer.classList.add("hidden");
        selectedSlice = "overall";
    }

    loadDashboardData();
}

function selectSlicerValue(sliceValue, element) {
    showMapNumbers = true;
    selectedSlice = sliceValue;
    
    const pills = document.querySelectorAll(".slicer-pill");
    pills.forEach(p => p.classList.remove("active"));
    element.classList.add("active");

    loadDashboardData();
}
