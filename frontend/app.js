const $ = (id) => document.getElementById(id);
const state = { books: [], query: "", status: "all" };
const bookDialog = $("bookDialog");
const loanDialog = $("loanDialog");

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}
function showNotice(message, isError = false) {
  const notice = $("notice");
  notice.textContent = message;
  notice.classList.toggle("error", isError);
  notice.hidden = false;
  window.clearTimeout(showNotice.timer);
  showNotice.timer = window.setTimeout(() => { notice.hidden = true; }, 4500);
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
}
function visibleBooks() {
  const q = state.query.toLowerCase();
  return state.books.filter(book => {
    const matches = [book.title, book.author, book.isbn, book.category].some(v => String(v || "").toLowerCase().includes(q));
    return matches && (state.status === "all" || book.status === state.status);
  });
}
function render() {
  $("totalBooks").textContent = state.books.length;
  $("availableBooks").textContent = state.books.filter(b => b.status === "available").length;
  $("loanedBooks").textContent = state.books.filter(b => b.status === "borrowed").length;
  const books = visibleBooks();
  $("booksBody").innerHTML = books.map(book => {
    const borrowed = book.status === "borrowed";
    const borrower = borrowed && book.borrower_name ? `<div class="book-author">With ${escapeHtml(book.borrower_name)}</div>` : "";
    return `<tr>
      <td><div class="book-name">${escapeHtml(book.title)}</div><div class="book-author">${escapeHtml(book.author)}</div>${borrower}</td>
      <td class="isbn">${escapeHtml(book.isbn || "—")}</td>
      <td>${escapeHtml(book.category || "Uncategorised")}</td>
      <td><span class="status ${borrowed ? "borrowed" : "available"}">${borrowed ? "On loan" : "Available"}</span></td>
      <td><div class="row-actions">
        ${borrowed ? `<button class="text-button" data-action="return" data-id="${book.id}">Return</button>` : `<button class="text-button" data-action="borrow" data-id="${book.id}">Check out</button>`}
        <button class="text-button" data-action="edit" data-id="${book.id}">Edit</button>
        <button class="text-button danger" data-action="delete" data-id="${book.id}">Delete</button>
      </div></td></tr>`;
  }).join("");
  $("booksTable").hidden = books.length === 0;
  $("emptyState").hidden = books.length !== 0;
}
async function loadBooks() {
  $("loading").hidden = false;
  $("booksTable").hidden = true;
  $("emptyState").hidden = true;
  try {
    const result = await api("/books");
    state.books = result.books;
    render();
  } catch (error) {
    showNotice(`${error.message}. Check your backend and Supabase settings.`, true);
    $("emptyState").hidden = false;
    $("emptyState").querySelector("h3").textContent = "Could not load books";
    $("emptyState").querySelector("p").textContent = "Start the backend and confirm backend/.env contains valid Supabase credentials.";
    $("emptyAddBtn").hidden = true;
  } finally { $("loading").hidden = true; }
}
function openNewBook() {
  $("bookForm").reset(); $("bookId").value = ""; $("dialogTitle").textContent = "Add a book";
  $("formEyebrow").textContent = "NEW RECORD"; $("saveBookBtn").textContent = "Save book";
  $("formError").hidden = true; bookDialog.showModal();
}
function openEditBook(book) {
  $("bookForm").reset(); $("bookId").value = book.id; $("title").value = book.title;
  $("author").value = book.author; $("isbn").value = book.isbn || "";
  $("category").value = book.category || ""; $("publishedYear").value = book.published_year || "";
  $("dialogTitle").textContent = "Edit book"; $("formEyebrow").textContent = "UPDATE RECORD";
  $("saveBookBtn").textContent = "Save changes"; $("formError").hidden = true; bookDialog.showModal();
}
$("addBookBtn").addEventListener("click", openNewBook);
$("emptyAddBtn").addEventListener("click", openNewBook);
$("closeDialog").addEventListener("click", () => bookDialog.close());
$("cancelDialog").addEventListener("click", () => bookDialog.close());
$("closeLoanDialog").addEventListener("click", () => loanDialog.close());
$("cancelLoan").addEventListener("click", () => loanDialog.close());
$("searchInput").addEventListener("input", e => { state.query = e.target.value.trim(); render(); });
$("statusFilter").addEventListener("change", e => { state.status = e.target.value; render(); });
$("bookForm").addEventListener("submit", async e => {
  e.preventDefault();
  const id = $("bookId").value;
  const body = { title: $("title").value.trim(), author: $("author").value.trim(), isbn: $("isbn").value.trim() || null,
    category: $("category").value.trim() || null, published_year: $("publishedYear").value ? Number($("publishedYear").value) : null };
  const errorBox = $("formError"); errorBox.hidden = true;
  try {
    await api(id ? `/books/${id}` : "/books", { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
    bookDialog.close(); await loadBooks(); showNotice(id ? "Book details updated." : "Book added to your catalogue.");
  } catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; }
});
$("booksBody").addEventListener("click", async e => {
  const button = e.target.closest("button[data-action]"); if (!button) return;
  const book = state.books.find(b => b.id === button.dataset.id); if (!book) return;
  try {
    if (button.dataset.action === "edit") openEditBook(book);
    if (button.dataset.action === "borrow") {
      $("loanBookId").value = book.id; $("loanBookTitle").textContent = `${book.title} — ${book.author}`;
      $("loanForm").reset(); $("loanBookId").value = book.id;
      const due = new Date(); due.setDate(due.getDate() + 14);
      $("dueDate").value = `${due.getFullYear()}-${String(due.getMonth()+1).padStart(2,"0")}-${String(due.getDate()).padStart(2,"0")}`;
      $("loanError").hidden = true; loanDialog.showModal();
    }
    if (button.dataset.action === "return") {
      if (!confirm(`Mark "${book.title}" as returned?`)) return;
      await api(`/books/${book.id}/return`, { method: "POST", body: JSON.stringify({}) });
      await loadBooks(); showNotice("Book marked as returned.");
    }
    if (button.dataset.action === "delete") {
      if (!confirm(`Delete "${book.title}" from the catalogue? This cannot be undone.`)) return;
      await api(`/books/${book.id}`, { method: "DELETE" }); await loadBooks(); showNotice("Book deleted.");
    }
  } catch (error) { showNotice(error.message, true); }
});
$("loanForm").addEventListener("submit", async e => {
  e.preventDefault(); $("loanError").hidden = true;
  try {
    await api(`/books/${$("loanBookId").value}/checkout`, { method: "POST", body: JSON.stringify({ borrower_name: $("borrower").value.trim(), due_date: $("dueDate").value }) });
    loanDialog.close(); await loadBooks(); showNotice("Checkout recorded successfully.");
  } catch (error) { $("loanError").textContent = error.message; $("loanError").hidden = false; }
});
loadBooks();
