import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3000;
const distPath = path.join(__dirname, "dist");
const indexHtml = path.join(distPath, "index.html");

// Fail fast if the production build is missing so the error is obvious
// at startup rather than producing cryptic 404s at runtime.
if (!fs.existsSync(indexHtml)) {
  console.error(
    `ERROR: ${indexHtml} not found. Run "npm run build" before starting the server.`
  );
  process.exit(1);
}

// Trust the first proxy hop (e.g., Render's reverse proxy) so that
// express-rate-limit reads the real client IP from X-Forwarded-For
// instead of the proxy's IP, preventing all users from sharing one limit.
app.set("trust proxy", 1);

const spaFallbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Serve static files from the dist directory
app.use(express.static(distPath));

// SPA fallback: route all non-file requests to index.html
app.get("*", spaFallbackLimiter, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
