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
    status.textContent = "Done.";
  } catch (err) {
    status.textContent = "Error: " + err.message;
    console.error(err);
  }
}

document.getElementById("runBtn").addEventListener("click", main);