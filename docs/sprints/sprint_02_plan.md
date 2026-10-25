# Sprint 02 — Books Management & Editorial Workflow: Revised Implementation Plan

> [!NOTE]
> This document is the authoritative Implementation Plan for Sprint 02, incorporating all conditional approval decisions and corrections.

---

## 1. Architectural Foundations & Boundary Check

- **ADR Compliance:** Adheres to Laravel 11 + MySQL + React/Vite + Tailwind CSS + Laravel Sanctum first-party SPA session authentication.
- **Separation of Platform Admin & Author:** The platform administrator (`users`) is completely decoupled from the author (`authors`). No automatic assumptions or hardcoded references link them.
- **Role-Based Permissions (Multi-Role):** Strictly 4 tables (`roles`, `permissions`, `role_user`, `permission_role`). No direct user permissions (`permission_user`). A user's effective permissions are the union of all permissions granted across all assigned roles.
- **Deletion Policy:** Hard and soft deletion of books is explicitly prohibited. Permanent retirement of a book record occurs exclusively through permanent publication cancellation (`publication_cancelled`).
- **File Security:**
  - Cover images: Public disk (`storage/app/public/books/covers/`).
  - Book files: Private disk (`storage/app/private/books/files/` or protected local disk) with no direct public URL access or public download endpoint in Sprint 02.

---

## 2. Database Schema & Relationships (Phase 1 Scope)

### A. Table: `roles`
| Column | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY, AUTO_INCREMENT` | Unique role identifier |
| `name` | `VARCHAR(100)` | `NOT NULL` | Display name (e.g., مدير عام, رئيس تحرير, مراجع) |
| `slug` | `VARCHAR(100)` | `UNIQUE, NOT NULL` | Role code (e.g., `admin`, `editor`, `reviewer`) |
| `description` | `TEXT` | `NULLABLE` | Description |
| `created_at` / `updated_at` | `TIMESTAMP` | `NULLABLE` | Audit timestamps |

### B. Table: `permissions`
| Column | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY, AUTO_INCREMENT` | Unique permission identifier |
| `name` | `VARCHAR(100)` | `NOT NULL` | Human-readable name (e.g., نشر كتاب) |
| `slug` | `VARCHAR(100)` | `UNIQUE, NOT NULL` | System slug (e.g., `books.publish`) |
| `description` | `TEXT` | `NULLABLE` | Description |
| `created_at` / `updated_at` | `TIMESTAMP` | `NULLABLE` | Audit timestamps |

### C. Pivot Tables: `role_user` & `permission_role`
- **`role_user`**: `user_id` (FK to `users.id`, cascade), `role_id` (FK to `roles.id`, cascade). Primary key: `(user_id, role_id)`.
- **`permission_role`**: `permission_id` (FK to `permissions.id`, cascade), `role_id` (FK to `roles.id`, cascade). Primary key: `(permission_id, role_id)`.

### D. Table: `authors`
| Column | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY, AUTO_INCREMENT` | Unique author identifier |
| `name` | `VARCHAR(255)` | `NOT NULL` | Author full name |
| `slug` | `VARCHAR(255)` | `UNIQUE, NOT NULL` | Slug for SEO / URLs |
| `bio` | `TEXT` | `NULLABLE` | Author biography |
| `avatar` | `VARCHAR(255)` | `NULLABLE` | Avatar path |
| `is_default` | `BOOLEAN` | `DEFAULT FALSE` | Flag identifying the default primary author |
| `created_at` / `updated_at` | `TIMESTAMP` | `NULLABLE` | Audit timestamps |

### E. Table: `books`
| Column | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY, AUTO_INCREMENT` | Unique book identifier |
| `title` | `VARCHAR(255)` | `NOT NULL` | Book title |
| `subtitle` | `VARCHAR(255)` | `NULLABLE` | Book subtitle |
| `slug` | `VARCHAR(255)` | `UNIQUE, NOT NULL` | URL slug |
| `description` | `TEXT` | `NULLABLE` | Book overview |
| `introduction` | `MEDIUMTEXT` | `NULLABLE` | Introductory text / sample |
| `author_id` | `BIGINT UNSIGNED` | `FOREIGN KEY (authors.id)` | Dedicated author reference |
| `declared_publication_date` | `DATE` | `NULLABLE` | Historical publication date |
| `cover_image_path` | `VARCHAR(255)` | `NULLABLE` | Public path to cover image |
| `book_file_path` | `VARCHAR(255)` | `NULLABLE` | Private path to book file |
| `book_file_type` | `VARCHAR(50)` | `NULLABLE` | MIME type (e.g. `application/pdf`) |
| `book_file_size` | `BIGINT UNSIGNED`| `NULLABLE` | Size in bytes |
| `workflow_status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'draft'` | `draft`, `in_review`, `changes_requested`, `approved` |
| `publication_status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'unpublished'` | `unpublished`, `published`, `temporarily_unpublished`, `publication_cancelled` |
| `created_by` | `BIGINT UNSIGNED` | `FOREIGN KEY (users.id)` | Creator reference |
| `published_by` | `BIGINT UNSIGNED` | `NULLABLE, FOREIGN KEY (users.id)`| Publisher reference |
| `published_at` | `TIMESTAMP` | `NULLABLE` | Platform initial publication timestamp |
| `cancelled_by` | `BIGINT UNSIGNED` | `NULLABLE, FOREIGN KEY (users.id)`| Cancellation actor |
| `cancelled_at` | `TIMESTAMP` | `NULLABLE` | Cancellation timestamp |
| `last_content_updated_at`| `TIMESTAMP` | `NULLABLE` | Timestamp of last saved content edit |
| `copied_from_book_id` | `BIGINT UNSIGNED` | `NULLABLE, FOREIGN KEY (books.id)`| Source reference for copied drafts |
| `created_at` / `updated_at` | `TIMESTAMP` | `NULLABLE` | Audit timestamps |

### F. Table: `book_reviews` (Editorial History)
| Column | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY, AUTO_INCREMENT` | Unique event identifier |
| `book_id` | `BIGINT UNSIGNED` | `FOREIGN KEY (books.id), CASCADE`| Target book |
| `user_id` | `BIGINT UNSIGNED` | `FOREIGN KEY (users.id)` | Actor |
| `action` | `VARCHAR(30)` | `NOT NULL` | `submitted`, `approved`, `changes_requested`, `resubmitted` |
| `comments` | `TEXT` | `NULLABLE` | Mandatory explanation on `changes_requested` |
| `created_at` | `TIMESTAMP` | `NOT NULL` | Event timestamp |

### G. Table: `book_publication_history` (Publication History)
| Column | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY, AUTO_INCREMENT` | Unique event identifier |
| `book_id` | `BIGINT UNSIGNED` | `FOREIGN KEY (books.id), CASCADE`| Target book |
| `user_id` | `BIGINT UNSIGNED` | `FOREIGN KEY (users.id)` | Actor |
| `event` | `VARCHAR(30)` | `NOT NULL` | `published`, `temporarily_unpublished`, `republished`, `cancelled` |
| `previous_publication_status` | `VARCHAR(30)` | `NOT NULL` | Prior state |
| `new_publication_status` | `VARCHAR(30)` | `NOT NULL` | Transitioned state |
| `notes` | `TEXT` | `NULLABLE` | Reason / notes |
| `created_at` | `TIMESTAMP` | `NOT NULL` | Event timestamp |

---

## 3. Author Initialization & Default Strategy

1. **Database-Driven Record:** The primary author is stored directly in `authors` via `AuthorSeeder`:
   - `name`: `"المؤلف الأساسي"` (neutral, editable initial label, never confused with platform admin).
   - `slug`: `"primary-author"`.
   - `is_default`: `true`.
2. **Author Maintenance:** An `AuthorController` endpoint (`GET /api/authors`, `PUT /api/authors/{id}`) allows editing the author's real name and bio without code modification.
3. **Default Author Selection:**
   - Books table uses real `author_id`.
   - Frontend queries `/api/authors` and automatically pre-selects the author where `is_default === true`.

---

## 4. Multi-Role Authorization & Permission Resolution

1. **Permission Union Calculation:**
   In `App\Models\User`:
   ```php
   public function roles()
   {
       return $this->belongsToMany(Role::class);
   }

   public function hasPermission(string $permissionSlug): bool
   {
       return $this->roles()
           ->with('permissions')
           ->get()
           ->flatMap(fn ($role) => $role->permissions)
           ->pluck('slug')
           ->contains($permissionSlug);
   }
   ```
   *(Optimized with cache or eager-loaded relation)*.
2. **Laravel Gates Integration:**
   In `AppServiceProvider`:
   ```php
   Gate::before(function (User $user, string $ability) {
       if ($user->hasPermission($ability)) {
           return true;
       }
   });
   ```
3. **Seeding Initial Roles & Permissions:**
   - Permissions seeded: `books.view`, `books.create`, `books.update`, `books.submit_review`, `books.review`, `books.approve`, `books.publish`, `books.unpublish`, `books.cancel_publication`, `books.copy`.
   - Roles seeded:
     - `admin` (مدير عام): Assigned all 10 permissions.
     - `editor` (محرر): Assigned `books.view`, `books.create`, `books.update`, `books.submit_review`, `books.copy`.
     - `reviewer` (مراجع): Assigned `books.view`, `books.review`, `books.approve`.
     - `publisher` (ناشر): Assigned `books.view`, `books.publish`, `books.unpublish`, `books.cancel_publication`.
   - The existing admin user is attached to the `admin` role, granting full operational access via RBAC.

---

## 5. Workflow & Publication State Machine Rules

1. **State Independence:** `workflow_status` and `publication_status` operate on distinct dimensions.
2. **Publication Validation Rules:**
   - Allowed only if `workflow_status === 'approved'` and `publication_status IN ('unpublished', 'temporarily_unpublished')`.
   - Requires non-empty `title`, valid `author_id`, valid `cover_image_path`, and valid `book_file_path`.
3. **Content Modification Transitions:**
   - Monitored fields: `['title', 'subtitle', 'description', 'introduction', 'author_id', 'declared_publication_date', 'cover_image_path', 'book_file_path']`.
   - If a saved update modifies any monitored field on a `published` or `temporarily_unpublished` book:
     - Transition to: `workflow_status = 'draft'`, `publication_status = 'unpublished'`.
     - Update `last_content_updated_at = now()`.
     - Log demotion event to `book_publication_history`.
   - If save occurs without changes, status remains untouched.
4. **Temporary Unpublication:** Transitions `publication_status` to `temporarily_unpublished`. Retains `workflow_status = 'approved'`. Republication is permitted without new review if content remains unchanged.
5. **Permanent Cancellation:** Transitions `publication_status` to `publication_cancelled`. Immutable state. Cannot be republished.
6. **Copying Cancelled Books:**
   - Creates a new record with a new ID and fresh slug.
   - Sets `workflow_status = 'draft'`, `publication_status = 'unpublished'`.
   - Copies text fields, author reference, and clones physical assets safely (`Storage::copy`).
   - Sets `copied_from_book_id = $sourceBook->id`.
   - Does NOT copy approval status, publication dates, cancellation events, or review logs.

---

## 6. Execution Phases

- **Phase 1 (Authorized for execution):**
  - Database migrations (`roles`, `permissions`, `role_user`, `permission_role`, `authors`, `books`, `book_reviews`, `book_publication_history`).
  - Eloquent Models, Relationships, and Permission Resolution (`User`, `Role`, `Permission`, `Author`, `Book`, `BookReview`, `BookPublicationHistory`).
  - Seeders (`RolePermissionSeeder`, `AuthorSeeder`) and assigning `admin` role to existing user.
  - Phase 1 PHPUnit tests verifying: multi-role permission resolution, author independence, and model relationships.
  - **MANDATORY STOP POINT:** Deliver Phase 1 report and wait for user approval.
- **Phase 2 (Requires subsequent explicit authorization):**
  - Business logic services (`BookService`, `BookWorkflowService`).
  - Controllers & validation requests.
  - API endpoints.
  - PHPUnit feature tests for state machine & file handling.
- **Phase 3 (Requires subsequent explicit authorization):**
  - Atomic Design frontend components and pages.
  - Integration with backend endpoints.
  - Build & manual verification.
