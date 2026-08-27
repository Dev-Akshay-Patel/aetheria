import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Search YouTube for official music video / lyrics video
  app.get('/api/search-video', async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q || typeof q !== 'string' || !q.trim()) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
      }

      const cleanQuery = q.trim();
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${cleanQuery} official video`
      )}&sp=EgIQAQ%253D%253D`; // sp=EgIQAQ%253D%253D filters for videos only

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        return res.status(502).json({ error: 'Failed to search YouTube' });
      }

      const html = await response.text();

      // Extract initial data JSON if present
      let results: Array<{
        videoId: string;
        title: string;
        author?: string;
        thumbnail?: string;
      }> = [];

      const initialDataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s);
      if (initialDataMatch && initialDataMatch[1]) {
        try {
          const parsed = JSON.parse(initialDataMatch[1]);
          const contents =
            parsed?.contents?.twoColumnSearchResultsRenderer?.primaryContents
              ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

          for (const item of contents) {
            const renderer = item?.videoRenderer;
            if (renderer && renderer.videoId) {
              const videoId = renderer.videoId;
              const title =
                renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || '';
              const author =
                renderer.ownerText?.runs?.[0]?.text ||
                renderer.shortBylineText?.runs?.[0]?.text ||
                '';
              const thumbnail =
                renderer.thumbnail?.thumbnails?.[renderer.thumbnail.thumbnails.length - 1]?.url ||
                `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

              results.push({ videoId, title, author, thumbnail });
              if (results.length >= 6) break;
            }
          }
        } catch (e) {
          console.warn('Failed to parse ytInitialData JSON:', e);
        }
      }

      // Regex fallback if JSON extraction didn't yield results
      if (results.length === 0) {
        const videoIdMatches = html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g);
        const seen = new Set<string>();
        for (const match of videoIdMatches) {
          const id = match[1];
          if (!seen.has(id)) {
            seen.add(id);
            results.push({
              videoId: id,
              title: `${cleanQuery}`,
              thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            });
            if (results.length >= 5) break;
          }
        }
      }

      if (results.length > 0) {
        return res.json({
          query: cleanQuery,
          topMatch: results[0],
          results,
        });
      }

      return res.json({
        query: cleanQuery,
        topMatch: null,
        results: [],
      });
    } catch (err: any) {
      console.error('Video search error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
