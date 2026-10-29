# Library Book Tracker

A beginner-friendly full-stack web application for managing a small library catalogue and tracking book checkouts and returns.

## 1. Problem and objectives

Small libraries need a reliable way to record which books they own, find a book quickly, and see whether it is available or borrowed. This application stores the catalogue in Supabase PostgreSQL and provides a responsive browser interface.

**Target users:** librarian or project demonstrator. This starter MVP does not include individual user accounts or a public-facing borrower portal.

## 2. Features

- Add, edit, search, filter, and delete book records.
- Track ISBN, author, category, and publication year.
- Check out an available book to a named borrower with a due date.
- Mark a borrowed book as returned.
- Summary cards for total, available, and borrowed titles.
- Server-side validation, parameterized Supabase query builder operations, basic security headers, and JSON API errors.
- Responsive HTML/CSS/Vanilla JavaScript frontend.

## 3. Technology stack

- HTML5, CSS3, Vanilla JavaScript
- Node.js (20 or newer), Express.js
- Supabase PostgreSQL and `@supabase/supabase-js`
- Git and GitHub

## 4. Folder structure

```text
library-book-tracker/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── routes/
│   │   └── books.js
│   ├── server.js
│   ├── supabase.js
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

## 5. Prerequisites

Install:
- [Node.js LTS](https://nodejs.org/) (Node 20+ recommended; npm is included)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/)
- A free [Supabase](https://supabase.com/) account

## 6. Set up Supabase

1. Sign in to Supabase and create a new project. Save the database password securely.
2. Open **SQL Editor** in the project dashboard and choose **New query**.
3. Open `database/schema.sql` in VS Code, copy all its contents, paste into SQL Editor, and click **Run**.
4. Open **Table Editor** and confirm that the `books` table exists.
5. In **Project Settings → API** (or the project's API/key settings), copy the project URL and the server-side `service_role` secret key. Supabase may label newer privileged keys as secret keys. Use a privileged server-only key, never a publishable/anon key for this backend's current configuration.
6. Keep the key private. Do not put it in `frontend/app.js`, HTML, GitHub, screenshots, or shared reports.

RLS is enabled on `books`. This starter app uses the privileged key only in the Node server, so requests must only be made to a trusted backend. The demo has no login or authorization layer and is intended for local coursework demonstration, not deployment on a public network. Before public deployment, add authentication and per-role authorization, then revisit the service-role/RLS design.

## 7. Configure environment variables

The file `backend/.env.example` documents required names. A local `backend/.env` template is included, but its values are placeholders and **will not connect** until replaced.

Set `SUPABASE_URL` to your project URL and `SUPABASE_SERVICE_ROLE_KEY` to the server-only secret from your Supabase dashboard. Keep `PORT=3000` for local use. `NODE_ENV=development` is fine locally.

Never commit `backend/.env`. The root and backend `.gitignore` files exclude it. If a real key is exposed, rotate it in Supabase immediately.

## 8. Install and run (Windows)

1. Extract the ZIP file and open the `library-book-tracker` folder in VS Code.
2. In VS Code, choose **Terminal → New Terminal**.
3. Change into the backend folder:
   ```bash
   cd backend
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Edit `backend/.env` with your real Supabase values.
6. Start the app:
   ```bash
   npm start
   ```
   The terminal should show `Library Book Tracker running at http://localhost:3000`.
7. Open [http://localhost:3000](http://localhost:3000) in your browser. Do not open `index.html` directly from the file system; it needs the Express API.

For development with Node's watch mode, run `npm run dev` from `backend/`.

## 9. Architecture

Browser (`frontend/index.html`, `styles.css`, `app.js`) → `fetch('/api/...')` → Express routes (`backend/routes/books.js`) → Supabase client (`backend/supabase.js`) → PostgreSQL `public.books`.

The service-role key bypasses RLS, so the backend must be trusted. The current MVP is unauthenticated and should only be run locally or in a controlled classroom demo.

## 10. REST API

All endpoints return JSON. No authentication is implemented in this MVP.

| Method | Path | Purpose | Request |
|---|---|---|---|
| GET | `/api/health` | Health check | none |
| GET | `/api/books` | List catalogue | none |
| POST | `/api/books` | Add a book | `{ "title": "...", "author": "...", "isbn": "...", "category": "...", "published_year": 2020 }` |
| PUT | `/api/books/:id` | Update book metadata | same fields as create |
| DELETE | `/api/books/:id` | Delete book | none |
| POST | `/api/books/:id/checkout` | Check out available book | `{ "borrower_name": "...", "due_date": "YYYY-MM-DD" }` |
| POST | `/api/books/:id/return` | Mark a borrowed book available | `{}` |

Common status codes: `200` success, `201` created, `400` invalid input/ID, `404` missing endpoint or record, `409` duplicate ISBN or conflicting book status, `500` database/server failure. Health check: `http://localhost:3000/api/health`.

## 11. How to use

1. Click **Add a book**, enter title and author, and optionally enter ISBN, category, and publication year.
2. Use search to find a title, author, ISBN, or category; use the status selector to filter available or borrowed books.
3. Select **Check out**, enter the borrower's name and due date, then confirm.
4. Select **Return** to mark it available again.
5. Use **Edit** to update book details or **Delete** to remove a record after confirmation.

ISBN values must be unique when supplied. Leave ISBN blank if not known.

## 12. Manual testing checklist

- [ ] `GET /api/health` returns `{ "status": "ok", ... }`.
- [ ] Add a book with a title and author; it appears in the table and total count increases.
- [ ] Leave title or author blank; browser/server validation prevents saving.
- [ ] Add a duplicate ISBN; expect a friendly conflict message.
- [ ] Search by title, author, ISBN, and category; matching rows remain.
- [ ] Filter by Available and On loan.
- [ ] Check out an available book; borrower and On loan status appear.
- [ ] Attempt checkout again; expect a conflict message.
- [ ] Return a borrowed book; it becomes Available.
- [ ] Edit book metadata and verify it persists after refresh.
- [ ] Delete a book and confirm it disappears.
- [ ] Test at desktop and narrow mobile widths.
- [ ] Stop the backend or use invalid credentials; confirm the page displays an error message.

## 13. Troubleshooting

- **`npm` is not recognised:** install Node.js LTS, then close and reopen VS Code.
- **Supabase configuration missing / placeholder URL:** edit `backend/.env` and restart the server.
- **Invalid API key / 401:** check project URL and server-only key; avoid extra quotes or spaces.
- **Relation `books` does not exist:** rerun `database/schema.sql` in the correct Supabase project.
- **Port already in use:** change `PORT` in `backend/.env`, then use the matching localhost port.
- **Changes don't appear:** refresh the browser; confirm the backend terminal has no errors.
- **Duplicate ISBN:** each non-empty ISBN must be unique; leave it blank when unknown.

## 14. GitHub upload

Create an empty repository on GitHub, then from the project root run:

```bash
git init
git status
git add .
git status
git commit -m "Build Library Book Tracker"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your repository's HTTPS URL. Check the second `git status` before committing: `backend/.env` and `backend/node_modules/` must not be staged, while `.env.example` should be included. If a secret was already committed, `.gitignore` alone is not enough: rotate it immediately and remove it from repository history.

## 15. Security and limitations

- This MVP does not implement login, role-based access, borrower accounts, email reminders, fine calculation, or a full historical loan ledger.
- Do not expose the app publicly in its current form. Anyone able to reach the server can perform catalogue operations, and the backend's privileged Supabase key bypasses RLS.
- For a real deployment, implement authentication and authorization, rate limiting, audit/history tables, and a least-privilege database design before exposing it to the internet.
- The database stores the current borrower and due date on each book; returning clears those current-loan fields.

## 16. Future improvements

Add Supabase Auth, librarian/student roles, separate loan-history records, overdue highlighting, pagination, CSV export, and automated integration tests.
