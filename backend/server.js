require("dotenv").config();
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const booksRouter = require("./routes/books");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "library-book-tracker" }));
app.use("/api/books", booksRouter);

app.use("/api", (_req, res) => res.status(404).json({ error: "API endpoint not found." }));
app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && "body" in err) return res.status(400).json({ error: "Invalid JSON request body." });
  console.error("Unhandled server error:", err.message);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

app.listen(port, () => console.log(`Library Book Tracker running at http://localhost:${port}`));
