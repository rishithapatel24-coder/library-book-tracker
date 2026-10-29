const express = require("express");
const supabase = require("../supabase");
const router = express.Router();

const allowedFields = ["title", "author", "isbn", "category", "published_year"];
function cleanBook(body = {}) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const author = typeof body.author === "string" ? body.author.trim() : "";
  const isbn = typeof body.isbn === "string" ? body.isbn.trim() : null;
  const category = typeof body.category === "string" ? body.category.trim() : null;
  const year = body.published_year === "" || body.published_year == null ? null : Number(body.published_year);
  if (!title || title.length > 180) throw new Error("Title is required and must be at most 180 characters.");
  if (!author || author.length > 120) throw new Error("Author is required and must be at most 120 characters.");
  if (isbn && isbn.length > 20) throw new Error("ISBN must be at most 20 characters.");
  if (category && category.length > 80) throw new Error("Category must be at most 80 characters.");
  if (year !== null && (!Number.isInteger(year) || year < 1000 || year > 2100)) throw new Error("Publication year must be between 1000 and 2100.");
  return { title, author, isbn: isbn || null, category: category || null, published_year: year };
}
function sendDbError(res, error) {
  if (error.code === "23505") return res.status(409).json({ error: "A book with that ISBN already exists." });
  if (error.code === "23503") return res.status(409).json({ error: "This record is linked to another record and cannot be changed." });
  console.error("Database operation failed:", error.message);
  return res.status(500).json({ error: "Database request failed. Verify the schema and Supabase configuration." });
}
function validId(id) { return typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id); }

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("books").select("id,title,author,isbn,category,published_year,status,borrower_name,due_date,created_at").order("created_at", { ascending: false });
    if (error) return sendDbError(res, error);
    res.json({ books: data });
  } catch (error) { return sendDbError(res, error); }
});
router.post("/", async (req, res) => {
  let book; try { book = cleanBook(req.body); } catch (error) { return res.status(400).json({ error: error.message }); }
  try {
    const { data, error } = await supabase.from("books").insert(book).select().single();
    if (error) return sendDbError(res, error);
    res.status(201).json({ book: data });
  } catch (error) { return sendDbError(res, error); }
});
router.put("/:id", async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid book ID." });
  let book; try { book = cleanBook(req.body); } catch (error) { return res.status(400).json({ error: error.message }); }
  try {
    const { data, error } = await supabase.from("books").update(book).eq("id", req.params.id).select().maybeSingle();
    if (error) return sendDbError(res, error);
    if (!data) return res.status(404).json({ error: "Book not found." });
    res.json({ book: data });
  } catch (error) { return sendDbError(res, error); }
});
router.delete("/:id", async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid book ID." });
  try {
    const { data, error } = await supabase.from("books").delete().eq("id", req.params.id).select("id").maybeSingle();
    if (error) return sendDbError(res, error);
    if (!data) return res.status(404).json({ error: "Book not found." });
    res.json({ message: "Book deleted." });
  } catch (error) { return sendDbError(res, error); }
});
router.post("/:id/checkout", async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid book ID." });
  const name = typeof req.body.borrower_name === "string" ? req.body.borrower_name.trim() : "";
  const dueDate = typeof req.body.due_date === "string" ? req.body.due_date : "";
  if (!name || name.length > 120) return res.status(400).json({ error: "Borrower name is required and must be at most 120 characters." });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(`${dueDate}T00:00:00Z`)) || dueDate < new Date().toISOString().slice(0,10)) return res.status(400).json({ error: "Choose a valid due date that is today or later." });
  try {
    const { data, error } = await supabase.from("books").update({ status: "borrowed", borrower_name: name, due_date: dueDate }).eq("id", req.params.id).eq("status", "available").select().maybeSingle();
    if (error) return sendDbError(res, error);
    if (!data) return res.status(409).json({ error: "Book is already on loan or no longer exists. Refresh the catalogue." });
    res.json({ book: data });
  } catch (error) { return sendDbError(res, error); }
});
router.post("/:id/return", async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid book ID." });
  try {
    const { data, error } = await supabase.from("books").update({ status: "available", borrower_name: null, due_date: null }).eq("id", req.params.id).eq("status", "borrowed").select().maybeSingle();
    if (error) return sendDbError(res, error);
    if (!data) return res.status(409).json({ error: "This book is not currently on loan, or it no longer exists." });
    res.json({ book: data });
  } catch (error) { return sendDbError(res, error); }
});

module.exports = router;
