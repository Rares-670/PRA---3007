const ENDPOINT = "https://sparql.wikipathways.org/sparql";

// Your data: diseases and their genes
const diseases = {
  "Duchenne muscular dystrophy": [{ symbol: "DMD", entrez: 1756 }],
  "Becker muscular dystrophy": [{ symbol: "DMD", entrez: 1756 }],
  "Limb-girdle muscular dystrophy": [
    { symbol: "SGCA", entrez: 6442 }, { symbol: "SGCB", entrez: 6443 },
    { symbol: "SGCG", entrez: 6445 }, { symbol: "SGCD", entrez: 6444 },
    { symbol: "CAPN3", entrez: 825 }, { symbol: "DYSF", entrez: 8291 },
    { symbol: "FKRP", entrez: 79147 }, { symbol: "ANO5", entrez: 203859 },
    { symbol: "LMNA", entrez: 4000 }
  ],
  "Facioscapulohumeral muscular dystrophy": [
    { symbol: "DUX4", entrez: 100288687 }, { symbol: "SMCHD1", entrez: 23347 },
    { symbol: "DNMT3B", entrez: 1789 }
  ],
  "Myotonic dystrophy": [
    { symbol: "DMPK", entrez: 1760 }, { symbol: "CNBP", entrez: 7555 }
  ]
};

// Builds the SPARQL query for a list of genes
function buildQuery(genes) {
  const ids = genes
    .map(g => `<https://identifiers.org/ncbigene/${g.entrez}>`)
    .join(" ");
  return `
    PREFIX wp:      <http://vocabularies.wikipathways.org/wp#>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    PREFIX dc:      <http://purl.org/dc/elements/1.1/>
    PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>
    SELECT DISTINCT ?symbol ?pathway ?title
    WHERE {
      VALUES ?entrez { ${ids} }
      ?gene a wp:GeneProduct ;
            rdfs:label ?symbol ;
            wp:bdbEntrezGene ?entrez ;
            dcterms:isPartOf ?pathway .
      ?pathway a wp:Pathway ;
               dc:title ?title ;
               wp:organismName "Homo sapiens" .
    }`;
}

// Sends a query to WikiPathways and returns the result rows
async function runQuery(query) {
  const url = ENDPOINT + "?query=" + encodeURIComponent(query) + "&format=json";
  const response = await fetch(url, {
    headers: { Accept: "application/sparql-results+json" }
  });
  if (!response.ok) throw new Error("Query failed: " + response.status);
  const data = await response.json();
  return data.results.bindings;
}

async function main() {
  const status = document.getElementById("status");
  status.textContent = "Loading...";
  const pathwayToDiseases = {};   // pathway title -> Set of diseases
  const pathwayToGenes = {};      // pathway title -> Set of genes
  let geneRows = "";
  const diseaseSummary = [];

  try {
    for (const [disease, genes] of Object.entries(diseases)) {
      const rows = await runQuery(buildQuery(genes));
      const found = new Set();
      for (const r of rows) {
        const title = r.title.value;
        found.add(r.symbol.value);
        (pathwayToDiseases[title] ??= new Set()).add(disease);
        (pathwayToGenes[title] ??= new Set()).add(r.symbol.value);
      }
      const pathwayCount = new Set(rows.map(r => r.title.value)).size;
            diseaseSummary.push({ disease: disease, count: pathwayCount });
      geneRows += `<tr><td>${disease}</td>
        <td>${genes.map(g => g.symbol).join(", ")}</td>
        <td>${[...found].join(", ") || "none found"}</td>
        <td>${pathwayCount}</td></tr>`;
    }

    document.getElementById("geneTable").innerHTML =
      `<table><tr><th>Disease</th><th>Genes (input)</th>
       <th>Genes found in WikiPathways</th><th>Number of pathways</th></tr>${geneRows}</table>`;

    const shared = Object.entries(pathwayToDiseases)
      .filter(([, d]) => d.size >= 2)
      .sort((a, b) => b[1].size - a[1].size);

    let sharedRows = shared.map(([title, d]) =>
      `<tr><td>${title}</td><td>${[...d].join("; ")}</td>
       <td>${[...pathwayToGenes[title]].join(", ")}</td></tr>`).join("");

    document.getElementById("sharedTable").innerHTML =
      `<table><tr><th>Pathway</th><th>Diseases</th><th>Genes involved</th></tr>${sharedRows}</table>`;

    drawBarChart(diseaseSummary);
    drawHeatmap(shared, Object.keys(diseases), pathwayToGenes);
    status.textContent = "Done.";
  } catch (err) {
    status.textContent = "Error: " + err.message;
    console.error(err);
  }
}

document.getElementById("runBtn").addEventListener("click", main);

function drawBarChart(data) {
  const margin = { top: 20, right: 30, bottom: 50, left: 280 };
  const width = 900 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  d3.select("#barChart").selectAll("*").remove();   // clear old chart

  const svg = d3.select("#barChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales turn data values into pixel positions
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count) || 1])
    .range([0, width]);
  const y = d3.scaleBand()
    .domain(data.map(d => d.disease))
    .range([0, height])
    .padding(0.2);

  // Axes
  svg.append("g").call(d3.axisLeft(y));
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5));

  // One rectangle per disease
  svg.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", 0)
    .attr("y", d => y(d.disease))
    .attr("width", d => x(d.count))
    .attr("height", y.bandwidth())
    .attr("fill", "#5B4B72");

  // Axis label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Number of WikiPathways pathways");
}

function drawHeatmap(shared, diseaseNames, pathwayToGenes) {
  // shared = [[pathwayTitle, Set of diseases], ...]; show the top 25
  const rows = shared.slice(0, 25).map(([title, set]) => ({ title, set }));
  const cell = 30;
  const margin = { top: 170, right: 260, bottom: 20, left: 380 };
  const width = diseaseNames.length * cell;
  const height = Math.max(rows.length, 1) * cell;

  d3.select("#heatmap").selectAll("*").remove();

  const svg = d3.select("#heatmap")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(diseaseNames).range([0, width]).padding(0.05);
  const y = d3.scaleBand().domain(rows.map(r => r.title)).range([0, height]).padding(0.05);

  // Column labels (diseases), rotated
  svg.selectAll(".col")
    .data(diseaseNames)
    .join("text")
    .attr("transform", d => `translate(${x(d) + x.bandwidth() / 2},-8) rotate(-45)`)
    .attr("text-anchor", "start")
    .attr("font-size", 12)
    .text(d => d);

  // Row labels (pathways), shortened if long
  svg.selectAll(".row")
    .data(rows)
    .join("text")
    .attr("x", -8)
    .attr("y", d => y(d.title) + y.bandwidth() / 2)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 12)
    .text(d => d.title.length > 55 ? d.title.slice(0, 55) + "…" : d.title);

  // Cells: one group per pathway row, one rectangle per disease
  svg.selectAll(".rowgroup")
    .data(rows)
    .join("g")
    .attr("transform", d => `translate(0,${y(d.title)})`)
    .selectAll("rect")
    .data(r => diseaseNames.map(name => ({
      name: name,
      title: r.title,
      on: r.set.has(name)
    })))
    .join("rect")
    .attr("x", d => x(d.name))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", d => d.on ? "#5B4B72" : "#EFEBF3")
    .append("title")   // hover tooltip
    .text(d => d.on
      ? `${d.name}\n${d.title}\nGenes: ${[...pathwayToGenes[d.title]].join(", ")}`
      : "");
}