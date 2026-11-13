# PRA---3007
## Comparing Muscular Dystrophies Through Genetic and Biological Pathways


### 1. Project Overview
- Investigates genetic and biological similarities and differences between five muscular dystrophies.
- Uses WikiPathways to identify biological pathways associated with selected disease genes.
- Compares pathway associations to identify potentially shared biological processes.

### 2. Research Question
**How do different muscular dystrophies compare in their associated genes, and which biological processes are shared between these diseases?**

Five diseases are investigated:
- Duchenne muscular dystrophy (DMD)
- Becker muscular dystrophy (BMD)
- Limb-girdle muscular dystrophy (LGMD)
- Facioscapulohumeral muscular dystrophy (FSHD)
- Myotonic dystrophy (DM)

### 3. Disease-Associated Genes

The following selected genes are used as input for the pathway analysis:

| Disease | Selected genes |
|---|---|
| Duchenne muscular dystrophy | DMD |
| Becker muscular dystrophy | DMD |
| Limb-girdle muscular dystrophy | SGCA, SGCB, SGCG, SGCD, CAPN3, DYSF, FKRP, ANO5, LMNA |
| Facioscapulohumeral muscular dystrophy | DUX4, SMCHD1, DNMT3B |
| Myotonic dystrophy | DMPK, CNBP |

Brief biological background:
- **DMD:** Encodes dystrophin, essential for muscle fibre stability. Mutations cause Duchenne and Becker muscular dystrophy.
- **LGMD genes:** Involved in muscle membrane stability, repair, structural integrity and maintenance.
- **FSHD genes:** Involved in epigenetic regulation and abnormal DUX4 expression.
- **DM genes:** DMPK and CNBP are associated with toxic RNA production and disrupted RNA processing.

*The selected genes represent a subset of known disease-associated genes, rather than an exhaustive list.*

### 4. Methodology
- Select five muscular dystrophies and their associated genes.
- Use NCBI Gene identifiers to map genes to WikiPathways.
- Generate disease-specific SPARQL queries to retrieve associated human biological pathways.
- Process results to identify genes found, pathway counts and shared pathways.
- Use JavaScript and D3.js to visualise the results through tables, a bar chart and a pathway heatmap.

**Data source:** [WikiPathways SPARQL endpoint](https://sparql.wikipathways.org/sparql)

### 5. Expected Outcome
- Compare the genetic and pathway profiles of five muscular dystrophies.
- Identify biological pathways shared between different diseases.
- Highlight potential common biological processes despite differences in their genetic causes.
- Present the findings through an interactive website.