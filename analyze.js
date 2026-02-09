export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: "URL não informada"
    });
  }

  try {
    const startTime = Date.now();

    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Catalog.AI Analyzer"
      }
    });

    const responseTime = Date.now() - startTime;
    const html = await response.text();

    // ===== Extrações básicas =====
    const getMatch = (regex) => {
      const match = html.match(regex);
      return match ? match[1].trim() : null;
    };

    const title = getMatch(/<title>(.*?)<\/title>/i);
    const description = getMatch(
      /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i
    );
    const h1 = getMatch(/<h1[^>]*>(.*?)<\/h1>/i);

    // ===== Regras de score =====
    let score = 0;

    if (response.status === 200) score += 20;
    if (responseTime < 2000) score += 15;
    if (url.startsWith("https://")) score += 15;
    if (title) score += 15;
    if (description) score += 15;
    if (h1) score += 20;

    if (score > 100) score = 100;

    // ===== Resultado =====
    return res.status(200).json({
      url,
      score,
      performance: {
        responseTimeMs: responseTime,
        status: response.status
      },
      seo: {
        title,
        description,
        h1
      },
      security: {
        https: url.startsWith("https://")
      },
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao analisar a URL",
      details: error.message
    });
  }
}
