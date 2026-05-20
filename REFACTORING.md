# Refactoring Plans

---

## [1] Passwordless Auth — Magic Links, No Password, No Email Verification Gate

### Overview

Move to a fully passwordless authentication system. Passwords are removed from the database and all forms. Login is replaced by a magic link / 6-character alphanumeric code sent to the user's email. HCaptcha is kept on the registration form for bot protection but removed from login. The separate email-verification gate is dropped — a successfully entered code proves email ownership. During registration the user enters their email address twice to prevent typos.

### Current Behavior

- **Registration:** User enters name, email, and password (×2). HCaptcha required. A verification link is sent by email.
- **Login:** User enters email + password. HCaptcha required.
- **Email verification:** User must click a verification link before accessing the app.

### Target Behavior

- **Registration:** User enters name and email (×2, to prevent typos). No password field. HCaptcha still required. After successful registration, a magic link / 6-character alphanumeric code is sent to the user's email. The user must enter the code to gain access — this simultaneously verifies the email address.
- **Login:** User enters email only. No password. No HCaptcha. A 6-character alphanumeric code is sent to the user's email. The user must enter the code to complete login.
- **Password:** Removed entirely — no `password` column in the database, no password field in any form, no password hashing.
- **Email verification check:** Removed as a separate gate. Ownership of the email address is implicitly proven by successfully entering the magic link code during registration.
- **Blocking gate:** The user cannot access any part of the app until they have successfully entered the 6-character code, both after registration and after every login attempt.

### Scope of Changes

#### Backend (`backend/`)

1. **New `MagicLinkCode` model & migration**

   - Table: `magic_link_codes`
   - `id`, `user_id` (FK), `code` (6-char alphanumeric, hashed), `expires_at` (15 min TTL), `attempts` (int, default 0), `used_at`, `timestamps`
   - Index on `(user_id, used_at, expires_at)` for fast lookup.
2. **Remove `password` column — new migration**

   - Drop the `password` column from the `users` table.
   - Remove `password` from the `User` model's `$fillable` / `$hidden` arrays.
   - Remove any `password_reset_tokens` table usage and related routes/controllers (password reset flow is obsolete in a passwordless system).
   - Remove `Hash::make(...)` calls from the registration controller.
   - **Drop the `password_reset_tokens` table** in the same migration.
   - **Remove all password-management infrastructure:** password-reset routes (`/forgot-password`, `/reset-password`), password-change route, their controllers (`ForgotPasswordController`, `NewPasswordController`, `PasswordController`), their mailers, and any related frontend screens, links, and form components.
3. **Magic link generation service** (`app/Services/MagicLinkService.php`)

   - Generate a cryptographically random 6-character alphanumeric code (uppercase A–Z + 0–9).
   - Store the code as **uppercase** and hash before persisting (e.g. `hash('sha256', strtoupper($code))`).
   - Normalise all incoming codes to uppercase before comparing.
   - Invalidate any previous unused codes for the same user before issuing a new one.
   - Return the plaintext code for inclusion in the email.
4. **New Mailable** (`app/Mail/MagicLinkMail.php`)

   - Replace (or extend) the existing email verification mailable.
   - Email subject: e.g. *"Your login code"*.
   - Body:
     - A prominent **"Log in"** button/link pointing to `GET /auth/verify?code=ABC123` — opens the default browser and completes login without any manual input.
     - The 6-character code displayed in plain text below the button for users who want to enter it manually inside the PWA.
     - Expiry notice (15 minutes).
5. **New API endpoint: `GET /auth/verify`** (clickable link from email)

   - Accepts `?code=ABC123` as a query parameter.
   - Normalises code to uppercase before hashing.
   - Validates the code: not expired, not used, attempts < 10, hash matches.
   - Marks the code as used, fully authenticates the session/token, and redirects to the app root.
   - On failure (expired, used, too many attempts): redirect to the login page with an error message.
6. **New API endpoint: `POST /api/auth/verify-code`** (manual entry inside PWA)

   - Accepts `{ code: string }`.
   - Normalises input to uppercase before hashing.
   - Same validation logic as the GET endpoint.
   - Increments an `attempts` counter on each failed attempt; invalidates the code after 10 failures.
   - Returns `{ success: true }` or appropriate error (`invalid_code`, `expired`, `too_many_attempts`).
7. **New API endpoint: `POST /api/auth/resend-code`**

   - Rate-limited (e.g. max 3 requests per 10 minutes per user/IP).
   - Generates and sends a new code, invalidating the previous one.
8. **Modify registration flow** (`app/Http/Controllers/Auth/RegisteredUserController.php` or equivalent)

   - Keep HCaptcha validation.
   - Validate that both submitted email values match (server-side check in addition to frontend).
   - Remove password from validation rules and user creation.
   - Remove: sending the standard email verification link.
   - Add: call `MagicLinkService` to generate and email a code after successful user creation.
   - Return a response that tells the frontend to show the code entry screen.
9. **Modify login flow** (`app/Http/Controllers/Auth/AuthenticatedSessionController.php` or equivalent)

   - Remove HCaptcha validation.
   - Remove password credential check — look up the user by email only, then issue a magic link code.
   - After the user is found, do **not** fully authenticate the session yet.
   - Call `MagicLinkService` to generate and email a code.
   - Return a response that tells the frontend to show the code entry screen.
10. **Remove email verification middleware/gate**

    - Remove `verified` middleware from all routes / route groups.
    - Remove or archive `app/Http/Middleware/EnsureEmailIsVerified.php` usage.
    - The `email_verified_at` column can remain in the DB but is populated automatically when the first magic link code is successfully verified.
11. **GraphQL / API route guards**

    - Add a new middleware `EnsureCodeVerified` (or equivalent session flag check) that blocks access to all protected routes until the magic link step is complete.
    - This replaces the old `verified` email middleware as the blocking gate.
12. **Config** (`config/HCaptcha.php`)

    - No changes needed — HCaptcha config stays, it is still used for registration.
13. **Tests** (`tests/Feature/`)

    - Update registration tests: no password field, two-email match validation, expect code email, no verification-link email.
    - Update login tests: no password field, no HCaptcha assertion, expect code email, expect blocked state before code entry.
    - Add tests for `verify-code` / `GET /auth/verify` endpoints: valid code, expired code, already-used code, wrong code, 10th wrong attempt invalidation, case-insensitivity.
    - Add tests for `resend-code` endpoint: rate limiting, old code invalidation, session cleared on new code.

#### Frontend (`frontend/`)

1. **Remove HCaptcha widget and password fields from the login form**

   - Remove the HCaptcha component/directive from the login template.
   - Remove the password input field from the login form; the form now only has an email field.
   - Remove any login-specific HCaptcha token handling in the login service/component.
2. **Update the registration form**

   - Remove the password and password-confirmation fields.
   - Add a second email field ("Confirm email") with client-side match validation.
   - Keep HCaptcha on the registration form.
3. **New "Enter Code" screen / component** (`src/app/auth/verify-code/`)

   - A simple full-screen gate shown immediately after registration or login (when the user is inside the PWA).
   - Input: 6 individual character boxes for clear UX; input is normalised to uppercase automatically.
   - Submit button + "Resend code" link (with cooldown timer to prevent spam).
   - On success: navigate to the main app.
   - On failure: show inline error (`wrong code`, `expired`, `too many attempts — please log in again`).
   - After 10 wrong attempts the code is invalidated; redirect to the login page.
4. **Auth state machine / guard**

   - Extend the auth state to include a `pendingVerification` state.
   - Angular route guard: redirect to the code-entry screen when state is `pendingVerification`.
   - Prevent navigation to any app route while in this state.
5. **Auth service updates**

   - After login response: detect `pendingVerification` status, store partial auth state, navigate to code-entry screen.
   - After registration response: same as above.
   - Add `verifyCode(code: string)` method calling `POST /api/auth/verify-code`.
   - Add `resendCode()` method calling `POST /api/auth/resend-code`.
   - Remove all password-related logic (login payload, registration payload).
6. **Remove email verification banner/prompt** (if any exists in the UI).

### Security Considerations

- Passwords are no longer stored — the attack surface of a leaked database is significantly reduced.
- Codes must expire (**15 minutes TTL**).
- Codes must be single-use (`used_at` check).
- Store only the **hash** of the uppercase code in the database, never the plaintext.
- **Max 10 wrong attempts** per code — on the 10th failure the code is immediately invalidated and the user must log in again.
- Rate-limit the login and resend-code endpoints to further mitigate brute-force attempts.
- The "partially authenticated" session must not grant access to any data until the code step is passed. If the session expires or is abandoned before the code is entered, it is discarded and the user must log in again.

### Migration Path

1. Write and test backend service + endpoints.
2. Add DB migrations: new `magic_link_codes` table; drop `password` column from `users`; drop `password_reset_tokens` table.
3. Update and run existing test suite.
4. Update frontend: remove password fields, add confirm-email field to registration, remove HCaptcha from login, add code-entry screen, update auth service.
5. Deploy with feature flag if needed to allow rollback.
6. Remove old email verification and password-reset infrastructure once magic link flow is stable.

### Decisions

- [X] **Passwordless:** Passwords are removed entirely from the database (`password` column dropped) and all forms. Login identifies the user by email only; proof of identity is the magic link code. The `password_reset_tokens` table and all password-management flows (reset, change) are also removed — add explicit scope items to drop those routes, controllers, and migrations.
- [X] **Registration email confirmation:** The registration form replaces the password field with a second "Confirm email" field. The frontend prevents form submission when the two email values do not match (inline validation error). The backend also validates the match server-side as a safety net.
- [X] **Clickable button + manual code entry:** The email contains a prominent clickable button/link (`GET /auth/verify?code=ABC123`) that opens the default browser and logs the user in directly — no manual entry required in that flow. The 6-character code is also displayed in the email so the user can type it manually inside the PWA if preferred. Both paths must be supported.
- [X] **Partial auth state is not persisted client-side:** If the user closes the browser window before entering the code, the pending state is gone. The user can still complete login by clicking the magic link in the email (which carries the code in the URL), but cannot resume manual code entry on a fresh page load. There is no `localStorage`/`sessionStorage` persistence of the pending state.
- [X] **No session created before code verification:** The backend does not create a Laravel session or issue a token until the code is successfully verified. The magic link code is tied to the user record only; `Auth::user()` returns nothing until verification is complete.
- [X] **`GET /auth/verify` redirect:** On success, redirect to the app root (`/`).
- [X] **Resend-code rate limiting key:** IP address only (user is not authenticated at that point).
- [X] **Migration is a hard cutover:** Existing users with passwords lose their passwords immediately when the migration runs. No transition period. Communicate this in release notes.
- [X] **Password management infrastructure removal:** The scope of changes explicitly includes dropping `password_reset_tokens` table, removing the password-reset and password-change routes, controllers, mailers, and any related frontend screens/links.
- [X] **Session expiry before code entry:** If the user does not enter the code (or click the link) before the 15-minute TTL, the code expires. The user must log in again from scratch — no resume on next visit.
- [X] **Case-insensitive codes:** Code input is normalised to uppercase on both the frontend (display/input) and the backend (before hashing) so `abc123` and `ABC123` are treated identically.
- [X] **Code TTL:** 15 minutes.
- [X] **Max wrong attempts:** 10 failed attempts invalidate the code immediately. The user must log in again.
- [X] **OTP input behaviour:** The 6-box code entry uses OTP-style inputs: each character auto-advances to the next box. Pasting a full 6-character string fills all boxes at once. The form auto-submits when the 6th box is filled.

### Implementation Status

#### Backend
- [x] `magic_link_codes` migration (`database/migrations/2026_05_20_204102_create_magic_link_codes_table.php`)
- [x] Drop `password` column and `password_reset_tokens` table migration (`database/migrations/2026_05_20_204103_remove_password_add_passwordless.php`)
- [x] `MagicLinkCode` model (`app/Models/MagicLinkCode.php`)
- [x] `MagicLinkService` (`app/Services/MagicLinkService.php`) — code generation, hashing, invalidation, verification
- [x] `MagicLinkMail` mailable (`app/Mail/MagicLinkMail.php`) with email view (`resources/views/emails/magic-link.blade.php`)
- [x] `MagicLinkController` (`app/Http/Controllers/Auth/MagicLinkController.php`) — login, verify-code, resend-code, GET verify-link
- [x] `routes/api.php` — custom `POST /api/login` (overrides Fortify's), `POST /api/auth/verify-code`, `POST /api/auth/resend-code`; removed email-verification routes
- [x] `routes/web.php` — added `GET /auth/verify` (clickable email link), removed `/reset-password` and `/forgot-password`
- [x] `app/Models/User.php` — removed `password`, `MustVerifyEmail`, `CanResetPassword`
- [x] `app/Actions/Fortify/CreateNewUser.php` — removed password, added `email_confirmation` validation, sends magic link
- [x] `app/Http/Middleware/CaptchaVerification.php` — HCaptcha applied to `register` only (not `login`)
- [x] `app/Providers/FortifyServiceProvider.php` — removed password features; `RegisterResponse` logs user out and returns `{ status: 'code_sent' }` (no session before code verification)
- [x] `config/fortify.php` — disabled `resetPasswords`, `emailVerification`, `updatePasswords` features
- [x] `database/factories/UserFactory.php` — removed password field
- [x] Feature tests (`tests/Feature/MagicLinkTest.php`) covering: registration, login, verify-code (valid/expired/used/wrong/attempts/case-insensitive), resend-code, service unit tests
- [x] GitHub Actions CI (`.github/workflows/backend-tests.yml`)

#### Frontend
- [x] `LoginComponent` — email-only form, no password, no HCaptcha
- [x] `RegisterComponent` — replaced password fields with confirm-email, kept HCaptcha
- [x] `VerifyCodeComponent` — code entry screen, auto-submit on 6 chars, resend with cooldown
- [x] `AuthService` — `pendingEmail` signal, `login()` returns `code_sent`, `verifyCode()`, `resendCode()`, removed password methods
- [x] `AuthApiService` — updated login/register signatures, added `verifyCode`, `resendCode`, removed password endpoints
- [x] `app.routes.ts` — added `verify-code` route, removed `forgot-password` / `reset-password` routes
- [x] `models/responses.ts` — added `VerifyCodeResponse`
- [x] `settings/edit-form` — removed password-change fields
- [x] Auth mocks updated (`auth.service.mock.ts`, `auth-api.mock.ts`)

---

## [3] Fix Sync Visibility — Changes Only Appear After Logout/Login

### Overview

Remote changes (arriving via Pusher/WebSocket) and even local writes are sometimes not reflected in the UI until the app is reloaded or the user logs out and back in. A manual `resync()` call in `AppComponent` works around this but is a symptom of a deeper Angular change-detection problem, not a real fix.

### Root Cause: Dexie Runs Outside Angular's NgZone

Angular uses **zone.js** to detect when async work finishes and automatically schedule change detection. Zone.js monkey-patches the browser's native async APIs (`setTimeout`, `Promise`, `XHR`, `WebSocket`, `fetch`, etc.). However, **Dexie uses its own internal Promise scheduler** (based on `IDBRequest.onsuccess` callbacks) and does **not** use the native `Promise` globally. Zone.js never patches Dexie's internal promises, so any `.then()` callback that resolves after a Dexie operation executes **outside Angular's NgZone**.

#### The broken update chain

```
User taps checkbox → item.patch()
  → collection.update()
      → await table.put(newDoc)          ← Dexie write; exits Angular zone here
      → this.$.next([newDoc])            ← fires OUTSIDE zone
        → MyQuery subscription fires     ← still outside zone
          → query.query().then(docs =>   ← another Dexie read
              subject.next(docs)         ← OUTSIDE zone → Angular never notified
            )
              → component subscription fires outside zone
                → signal.set() / this.items = docs  ← no CD triggered
```

The **same problem** applies to the remote path:

```
Pusher WebSocket message (inside zone via zone.js WebSocket patch)
  → ReplicationService.streamSubjects.next('RESYNC')
    → Replicator.pull()
      → collection.remoteBulkAdd(docs)
          → await table.bulkAdd(...)     ← exits zone
          → this.$.next([])              ← outside zone → UI stuck
```

Although WebSocket events start inside zone, the first `await` on a Dexie call loses the zone context. After that, the entire downstream chain is outside zone.

#### Secondary issue: `EventEmitter` used as an internal event bus

`MyCollection.$` was typed as Angular's `EventEmitter`, which is designed exclusively for component `@Output` bindings. Using it for service-to-service pub/sub is semantically wrong and makes the class depend on `@angular/core` in a non-injectable context. A plain `Subject` is correct here.

### Why the Workaround "Works"

`AppComponent.resync()` is called on `visibilitychange`, `pageshow`, and `focus` events. Zone.js patches all three of these DOM events, so the `resync()` call and the subsequent pull are started **inside** zone. The first pull handler fires inside zone, so the `subject.next()` in `MyQuery` eventually gets called inside zone and Angular runs change detection. This masks the bug — but only after the user switches away and back to the tab.

### Fix

**Wrap all `collection.$.next()` calls in `NgZone.run()`** by threading an optional `NgZone` instance into `MyCollection`. This ensures that regardless of where the call originates (a Dexie callback, a Pusher event, a background timer), the final emission that components subscribe to is always inside Angular's zone.

#### Scope of Changes

1. **`MyCollection`** (`src/app/mydb/collection.ts`)

   - Accept an optional `NgZone` as the last constructor parameter.
   - Add a private `emit(docs)` helper that calls `ngZone.run(() => this.$.next(docs))` when a zone is present, or `this.$.next(docs)` directly otherwise (preserves backwards compatibility in unit tests where no zone exists).
   - Replace all direct `this.$.next(...)` calls with `this.emit(...)`.
   - Replace `EventEmitter` with `Subject` from RxJS — `EventEmitter` is for `@Output` bindings only and must not be used as a general event bus.
2. **`DataService`** (`src/app/services/data/data.service.ts`)

   - Inject `NgZone` and pass it as the last argument to every `new MyCollection(...)` call in `addCollections()`.
3. **Tests** (`src/app/mydb/collection.spec.ts`) — new file

   - Verify `ngZone.run()` is called on `insert()`, `update()`, and `remoteBulkAdd()`.
   - Verify that omitting `NgZone` does not throw and still emits (backwards compatibility).
   - Verify `collection.$` is a `Subject` and not an `EventEmitter`.

### Status

- [X] `MyCollection` updated (emit via zone, replaced `EventEmitter` → `Subject`)
- [X] `DataService` injects and forwards `NgZone`
- [X] Unit tests added in `collection.spec.ts`
- [ ] Remove the manual `resync()` calls from `AppComponent` once the fix is confirmed stable in production — **manual judgement call** by the developer after observing production behaviour; no automated metric gates this. (Keep the `visibilitychange` hook for normal reconnect scenarios, but remove the `lastPusherState` guard which was only needed to force a CD cycle.)

### Migration Path

1. Apply changes to `MyCollection` and `DataService` — already done.
2. Deploy and verify that list changes made on another device appear immediately without any tab-switch workaround.
3. Remove the `this.dataService.resync()` call from `AppComponent.resync()` (keep `this.authService.checkInit()`).

---

## [2] Persistent Sort Order for List Items + Optimistic UI Updates

### Overview

Replace the fully-recomputed, ephemeral sorting of list items with a hybrid approach: a **persistent `sort_order` field** stored globally on each item as the stable position index (fractional indexing), combined with **cached category assignment** so the expensive grocery-categorisation fuzzy match is not re-run on every render. Additionally, fix several **blocking UI update paths** in the custom DB layer (`MyCollection` / `MyDocument` / `MyQuery`) where the UI currently has to wait for sequential IndexedDB read+write operations before a user action (e.g. ticking a checkbox) is reflected on screen.

### Current Behavior

#### Sorting

Every time a list is opened or any item changes, the Angular `computed()` signal re-runs `groupItems()` in full:

1. **Category assignment** — for grocery lists each item is scored against every entry in the grocery-category dictionary via a fuzzy string-match (`voteForGroceryCategory`). Complexity: O(items × categories × words-per-item), runs synchronously on the main thread.
2. **Slot sorting** — `sortItems()` re-sorts every slot: done-status first, then `due` date, then `localeCompare` on name (alphabetical fallback).
3. There is **no persisted sort position** on the item. If the categorisation logic or grocery dictionary changes, items can silently change slots or order.

#### Blocking UI update path (identified by code analysis)

When a user taps a checkbox (`toggleDone()`), the following chain blocks the UI before Angular can re-render:

```
toggleDone()
  → item.patch()                           // MyDocument
    → collection.update()                  // MyCollection
      → await table.put(newDoc)            // ① IndexedDB WRITE — blocks here
      → $.next([newDoc])                   // emits to all MyQuery subscribers
        → MyQuery.update()
          → query.query()                  // full Dexie table scan
            → table.toCollection()
                .filter().toArray()        // ② IndexedDB READ — blocks here
          → subject.next(docs)             // Angular signal finally updates
            → computed() re-runs groupItems() // ③ O(N×C×W) on main thread
```

The UI cannot update until **two sequential IndexedDB operations complete** and then the full sort+group runs. The `replication$.next()` push to the server is already fire-and-forget (✓), but the local visual feedback is blocked.

### Problems

| Problem                                                                  | Impact                                                                     |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Full O(N×C×W) grocery recompute on every change                        | Wasted CPU; noticeable lag on long grocery lists                           |
| Grocery category computed from item name at runtime                      | Category can change if the dictionary is updated, causing surprising jumps |
| No stable position field                                                 | Impossible to support manual drag-to-reorder                               |
| `localeCompare` alphabetical fallback inside a slot                    | Items re-order silently when renamed                                       |
| UI update blocked by IndexedDB WRITE before `$.next()`                 | User sees no visual feedback until the write completes                     |
| `MyQuery.update()` does a full table scan after every collection event | Unnecessary read latency; scales poorly with list size                     |

### Proposed Solution

Three complementary parts:

#### Part A — Persistent `sort_order` field (fractional indexing, globally scoped)

Add a floating-point `sort_order` column to `list_items`. The value is **global across the whole list** — not per-slot — so items can move freely between categories without losing their relative order context.

- Use **fractional indexing**: inserting between A (`sort_order=1.0`) and B (`sort_order=2.0`) gives `sort_order=1.5`. No renumbering needed.
- New items at the end of a list get `sort_order = maxSortOrderInList + 1.0`.
- A periodic client-side **rebalance** renumbers to integers (1, 2, 3, …) when the smallest gap drops below `1e-9`.
- `sort_order` replaces the `localeCompare` alphabetical fallback as the tiebreaker within a slot.

#### Part B — Cached `category` field (grocery lists)

Add a **local-only** `category` field to the item document (excluded from replication push). Populated once on first load or when `name` changes; reused on all subsequent renders. Reduces per-render cost from O(N×C×W) to O(1) for cached items.

#### Part C — Optimistic UI updates (fix blocking path)

The core fix: **emit to the UI immediately** with the in-memory new state, then persist to IndexedDB in the background.

`MyCollection.update()` and `MyCollection.insert()` currently `await table.put/add()` **before** calling `$.next()`. This must be inverted:

1. Build the new document state in memory.
2. Call `$.next([newDocInMemory])` immediately — Angular re-renders with optimistic state.
3. Persist to IndexedDB asynchronously (no `await` before the emit).
4. On write failure (rare): emit a correction via `$.next()` with rolled-back state and show a snackbar error.

Additionally, `MyQuery.update()` runs a full Dexie table scan on **every** `$.next()` event, even for unrelated items. Replace with an in-memory document cache inside `MyQuery` that patches only changed documents, falling back to a full scan only for structural changes (insertions/deletions, signalled by an empty array from `$.next()`).

### Scope of Changes

#### Backend (`backend/`)

1. **New migration — add `sort_order` to `list_items`**

   - `$table->double('sort_order')->nullable(false)->default(0);`
   - Add a DB index on `(lists_id, sort_order)`.
   - Backfill existing rows: `UPDATE list_items SET sort_order = ROW_NUMBER() OVER (PARTITION BY lists_id ORDER BY created_at)`.
2. **Expose `sort_order` in the GraphQL schema** (`graphql/list-item.graphql`)

   - Add `sort_order: Float!` to the `ListItem` type and create/update input types.
3. **Conflict handler update for `sort_order`** (`backend/app/Models/ListItem.php` push resolver)

   - `sort_order` uses **last-write-wins** (highest `updatedAt` wins), matching the existing LWW strategy.
4. **Ordered default pull query**

   - `pullBulk` should `ORDER BY sort_order ASC` so items arrive pre-sorted, eliminating the client-side sort on initial load.

#### Frontend (`frontend/`)

5. **Update `ITEM_SCHEMA`** (`src/app/mydb/types/list-item.ts`)

   - Add `sort_order: { type: 'number' }` — synced field.
   - Add `category: { type: ['string', 'null'] }` — **local-only**; stripped by `Replicator.applyPushMod()` which already removes keys not in the schema (ensure `category` is not added to the GraphQL type).
   - Bump schema version; Dexie migration sets `sort_order = 0` for existing local docs (correct values pulled on next resync).
6. **Update `newItem()` factory** (`src/app/mydb/types/list-item.ts`)

   - Accept `maxSortOrder: number` parameter; set `sort_order = maxSortOrder + 1.0`.
7. **Update `itemsConflictHandler`** (`src/app/mydb/types/list-item.ts`)

   - Add `sort_order`: LWW via `updatedAt`.
   - Do **not** propagate `category` — it is local-only.
8. **Update `sortItems()`** (`src/models/categories.ts`)

   - New sort priority within a slot:
     1. `done=false` before `done=true`.
     2. Among not-done with `due`: ascending `due`.
     3. Among not-done without `due`: ascending `sort_order`.
     4. Among done: ascending `sort_order`.
   - Remove the `localeCompare` alphabetical fallback entirely.
9. **Update `groupItems()`** (`src/models/categories.ts`)

   - For grocery lists: read `item.category` if set; if unset, compute via `voteForGroceryCategory` and write back via `item.patch({ category: computed })`.
   - `sort_order` is global — slot ordering within a category is determined directly by the global value.
10. **New rebalance utility** (`src/models/sort-order.ts`)

    - `needsRebalance(items: MyItemDocument[]): boolean` — true if min adjacent gap < `1e-9`.
    - `rebalance(items: MyItemDocument[]): { id: string, sort_order: number }[]` — assigns integer positions 1, 2, 3, …
    - Called at the end of `groupItems()` if needed; patches are batched into a single write + push.
11. **Fix `MyCollection.update()` and `MyCollection.insert()` — optimistic emit** (`src/app/mydb/collection.ts`)

    - Build the new doc state in memory.
    - Call `$.next([newDocOptimistic])` **immediately**, before any `await`.
    - Start the IndexedDB write in the background: `table.put(newDoc).then(() => replication$.next()).catch(() => { $.next([rollback]); snackbar.error(...) })`.
12. **Fix `MyQuery.update()` — in-memory document cache** (`src/app/mydb/query.ts`)

    - `MyQuery` maintains an internal `Map<primaryKey, MyDocument>` as its current result set.
    - When `collection.$.next([updatedDocs])` fires with a **non-empty** array: patch only those documents in the map (O(k), typically k=1).
    - When `collection.$.next([])` fires (bulk/structural change, e.g. remote pull): fall back to a full Dexie scan.
    - This eliminates the per-action IndexedDB read for all typical user interactions.

### Optimistic Update Flow (after fix)

```
toggleDone()
  → item.patch()
    → collection.update()
      → build newDocOptimistic in memory
      → $.next([newDocOptimistic])          // ① UI updates IMMEDIATELY (< 1 ms)
        → MyQuery patches in-memory map     // O(1)
        → subject.next(docs)
          → computed() re-runs groupItems() // O(N), cache hits only
      → table.put(newDoc) [background]      // ② IndexedDB write, no await
        → replication$.next() [background]  // ③ push to server, already async
```

### Sort Priority Summary

```
Within a slot:
  1. done=false  before  done=true
  2. (not done, has due)  → sort by due ASC
  3. (not done, no due)   → sort by sort_order ASC  ← replaces localeCompare
  4. (done)               → sort by sort_order ASC
```

### Data Integrity Guarantees

| Risk                                                   | Mitigation                                                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Two clients insert at the same global position         | LWW on `sort_order` via `updatedAt`; fractional indexing makes collision extremely unlikely                |
| Sort order drift after many insertions                 | Client-side rebalance at gap < 1e-9; synced back as a normal patch                                             |
| Grocery category changes when dictionary updated       | Cache keyed to `name`; clearing local storage or a one-time migration flag invalidates all cached categories |
| Optimistic update followed by server conflict          | Conflict handler resolves;`$.next()` re-renders corrected state; user sees a brief flicker at most           |
| Existing items have `sort_order = 0` after migration | Backend backfill sets correct values; client pulls on next resync                                              |

### Migration Path

1. Write backend migration (`sort_order` column + index + backfill).
2. Update `ITEM_SCHEMA` (add `sort_order`, `category`); bump Dexie schema version.
3. Update `newItem()`, `sortItems()`, `groupItems()`, `itemsConflictHandler`.
4. Write `sort-order.ts` rebalance utility.
5. Fix `MyCollection.update/insert` for optimistic emit (Part C).
6. Fix `MyQuery.update()` for in-memory cache (Part C).
7. Update GraphQL schema and resolvers.
8. Run tests; verify order stability on concurrent edits and correct optimistic rollback on conflict.

### Open Questions

- [X] When a grocery item's `name` changes and its cached `category` is invalidated, should it snap to the new category immediately or wait for the user to confirm: No, the change should apply immediately.

### Decisions

- [X] **`sort_order` is scoped per list:** The value is unique within a `lists_id`. No item appears in multiple lists, so there is no cross-list ordering concern.
- [X] **Simultaneous inserts by two collaborators:** Both may compute the same `maxSortOrder + 1.0`. LWW via `updatedAt` resolves the conflict; the first writer wins the bottom position. The losing item may jump one slot, which is acceptable — fractional indexing keeps collisions extremely rare in practice.
- [X] **Optimistic rollback UX:** On IndexedDB write failure, show a snackbar telling the user "The change could not be saved." The item snaps back to its previous state only after the user dismisses/acknowledges the snackbar (not silently).
- [X] **`category` cache invalidation:** `category` is cleared and immediately recomputed inside `item.patch()` whenever `name` is part of the patch payload. This gives immediate, in-place category assignment without waiting for the next `groupItems()` cycle.
- [X] **Rebalance timing:** Rebalance runs in the background after a list is opened (not inside `computed()`), so the user never observes any compute pause. Patches are batched and pushed as a normal background write.
- [X] **New item `sort_order` initial value:** New items use `maxSortOrder + 1.0` within the list. The fuzzy grocery algorithm determines which slot the item appears in; `sort_order` is the tiebreaker within that slot.

### Notes

- **Drag-to-reorder** (optional future feature, not in scope for this refactoring): once `sort_order` is in place, drag-to-reorder can be added to grocery lists. When a user drags an item into a different grocery category slot, the app should send a **notification email to the list admin** containing the item name, the source category, and the target category. This creates a passive feedback loop to improve the grocery dictionary over time without requiring any explicit user submissions.

## [4] Bug Fixes

### [4.1] Adding / Manipulating Items with a Due Date + Reminder

#### Bug A — `value` getter emits the literal string `"different"` when flatpickr is closed without a selection

**Location:** `frontend/src/app/components/selects/date-chip-select/date-chip-select.component.ts` — `get value()`

**Reproduction:** Click the *"Andere"* ("Other") chip in the due-date selector → immediately close the flatpickr calendar without choosing a date → submit the item.

**Root cause:** When the flatpickr `onClose` fires without a date being picked, `this.flatpickr.selectedDates[0]` is `undefined`, so `closePickr()` sets `this.date = undefined`. The `value` getter then evaluates:

```ts
case 'different':
  if (typeof this.date === 'string' && !!this.date) { ... }
  else { return this.chipOption; }  // returns 'different'
```

`typeof undefined === 'string'` is `false`, so the getter returns the literal string `"different"`. This propagates through `onChange` to the parent form control, and the Angular form's value becomes `"different"`.

**Downstream consequence in `list.component.ts`:** `getDueDate('different')` hits the `default` switch branch and returns the raw string `"different"`. `newItem({ due: 'different', ... })` persists an invalid date string to IndexedDB and the replication push sends it to the backend, which accepts any non-null string in the `due` field.

**Downstream consequence in `update-item-sheet.component.ts`:** `new Date('different')` is `Invalid Date`. `datesAreEqual` returns false, so `patch.due = 'different'` is written to the item document on every save attempt.

**Fix:** In `get value()`, when `this.date` is falsy (including `undefined`), treat it as if no date was selected — return the default option instead of `'different'`:

```ts
get value(): string {
  if (this.chipOption === 'different') {
    const d = this.date;
    if (d instanceof Date && !isNaN(d.valueOf())) return d.toISOString();
    if (typeof d === 'string' && !!d)              return new Date(d).toISOString();
    // picker was opened but closed without a selection — fall back to default
    this.chipOption = this.defaultOption || '';
    return this.chipOption;
  }
  return this.chipOption;
}
```

Also add a guard in `closePickr()` to clear the chip back to the default when `selectedDates[0]` is `undefined`:

```ts
closePickr() {
  if (this.pickrIsOpen && this.flatpickr) {
    this.pickrIsOpen = false;
    const picked = this.flatpickr.selectedDates[0];
    if (!picked) {
      // user dismissed without picking — revert to default
      this.chipOption = this.defaultOption || '';
      this.date = '';
    } else {
      this.date = picked;
    }
    this.pickrClosed.emit();
    this.onChange(this.value);
    this.onTouched();
  }
}
```

---

#### Bug B — `writeValue` silently misses `flatpickr.setDate()` because flatpickr is not yet initialised

**Location:** `date-chip-select.component.ts` — `writeValue()` / `ngAfterViewInit()`

**Reproduction:** Open the *Edit item* bottom sheet for an item that already has a custom due date (one that maps to the *"Andere"* chip). The chip correctly shows the formatted date but when the user taps that chip to open the datepicker, it opens with no date pre-selected (empty calendar).

**Root cause:** Angular's reactive-form machinery calls `writeValue()` during component initialisation, which happens **before** `ngAfterViewInit()`. `writeValue` contains `this.flatpickr?.setDate(this.date)` — the optional chaining silently no-ops because `this.flatpickr` is still `undefined`. When `initFlatpickr()` runs in `ngAfterViewInit()`, the stored `this.date` is correct but `setDate` is never called again, so the flatpickr instance starts with an empty selection.

**Consequence:** If the user opens the picker and closes it without choosing a new date, `closePickr()` reads `flatpickr.selectedDates[0] === undefined` → falls into Bug A above → the existing due date is silently overwritten with `null`/`"different"`.

**Fix:** After calling `initFlatpickr()` in `ngAfterViewInit()`, re-apply any date that `writeValue` may have stored while flatpickr was not yet ready:

```ts
ngAfterViewInit(): void {
  this.initFlatpickr();
  // re-apply a date stored by writeValue() before flatpickr was ready
  if (this.date) {
    this.flatpickr?.setDate(this.date);
  }
}
```

---

#### Bug C — Stale flatpickr selection when chip is toggled away from *"Andere"*

**Location:** `date-chip-select.component.ts` — `changeOption()`

**Reproduction:** Pick a custom date via the *"Andere"* chip → switch to *"Heute"* or *"Morgen"* → switch back to *"Andere"* → the calendar opens with the previously picked date still highlighted, even though the component's effective value has been reset to the preset option.

**Root cause:** `changeOption()` sets `this.date = ''` when deselecting the custom chip, but never calls `this.flatpickr?.clear()`. The flatpickr instance retains its internal `selectedDates` array from the previous session.

**Fix:** In the deselect branch of `changeOption()`, and whenever any non-`'different'` chip is selected, clear the flatpickr instance:

```ts
changeOption(event: MatChipListboxChange) {
  setTimeout(() => {
    if (!event.value) {
      this.chipOption = this.defaultOption || '';
      this.date = '';
      this.flatpickr?.clear();     // ← add this
      this.onChange(this.value);
      this.onTouched();
    } else if (event.value === 'different' && this.showOthers && !this.pickrIsOpen) {
      this.openFlatpickr();
    } else {
      this.date = '';
      this.flatpickr?.clear();     // ← add this
      this.onChange(this.value);
      this.onTouched();
    }
  }, 10);
}
```

---

#### Bug D — `pickrClosed` emitted before `onChange` — parent form sees old value during the close event

**Location:** `date-chip-select.component.ts` — `closePickr()`

**Reproduction:** In the *add item* bar in `list.component`, the `(pickrClosed)` output is bound to `closeFocusInput()`. `closeFocusInput()` reads the `pickerOpen` / `ignoreNext` state and optionally refocuses the text input. Because `pickrClosed.emit()` fires **before** `this.onChange(this.value)`, any handler on the parent that tries to read the form-control value at that moment will still see the pre-pick value.

**Root cause:** In `closePickr()`:

```ts
this.pickrClosed.emit();    // ① parent handler runs now
this.onChange(this.value);  // ② form control updated AFTER
```

**Fix:** Swap the two lines so the form control is always up to date before any parent handler fires:

```ts
this.onChange(this.value);  // ① update form value first
this.onTouched();
this.pickrClosed.emit();    // ② then notify parent
```

---

#### Bug E — Default reminder applied even when `due` is the literal `"different"` (invalid date)

**Location:** `frontend/src/app/components/list/list.component.ts` — `addItem()`

**Root cause (depends on Bug A):** When Bug A is present and `getDueDate(...)` returns `"different"`, `!!due` is `true` (non-empty string). The guard `if (!!due && !!defaultReminder)` passes, and `getReminderDate(new Date("different"), ...)` is called. `new Date("different")` is `Invalid Date`; all arithmetic on it produces `NaN`. The resulting `reminder` ISO string is `"Invalid Date"`, which is persisted to the database.

**Fix (primary):** Fix Bug A so `getDueDate` never receives `"different"`. As an additional defensive layer, validate the date before calling `getReminderDate`:

```ts
const due = getDueDate(this.newItemDue.value || '');
const dueDate = due ? new Date(due) : null;

if (dueDate && !isNaN(dueDate.valueOf()) && defaultReminder) {
  Object.assign(item, { reminder: getReminderDate(dueDate, defaultReminder) });
}
```

---

### Interaction Between Datepicker and Date Chip — Summary

The `DateChipSelectComponent` combines a `MatChipListbox` (preset options) with a **flatpickr** calendar instance (custom date via the *"Andere"* chip). The following interaction contract is currently broken in several places:

| State transition                                                    | Expected behaviour                                                         | Actual behaviour (before fixes)                                                           |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Open sheet with existing custom date                                | Chip shows `"Andere"` with formatted date; datepicker opens to that date | Datepicker opens empty (Bug B)                                                            |
| Click*"Andere"*, close calendar without picking                     | Revert to previous chip selection, form value unchanged                    | Form value set to `"different"` (Bug A)                                                 |
| Pick custom date, then switch to*"Heute"*, then back to*"Andere"* | Datepicker opens empty (no pre-fill)                                       | Datepicker opens to the old custom date (Bug C)                                           |
| Save item after picking a custom date                               | `due` = selected ISO string                                              | `due` may still be the old value if parent read the form during the close event (Bug D) |
| Add item; flatpickr mis-emits `"different"`                       | `reminder` not set                                                       | `reminder` = `"Invalid Date"` (Bug E)                                                 |

---

### [4.2] Duplicate Push Notifications When Another User Changes Items

#### Overview

When a collaborator edits one or more items in a shared list, the other list members receive **two or more identical push notifications** for the same change. This is caused by three independent issues in the push replication pipeline: a missing concurrency guard on the client, a retry that re-submits already-processed items, and a typo in the server-side notification classifier.

---

#### Bug F — No concurrency guard in `Replicator.push()` — overlapping push calls include the same touched items twice

**Location:** `frontend/src/app/mydb/replication.ts` — `push()` / `constructor`

**Reproduction:** Edit an item in a shared list. On slow connections the problem is reproducible reliably; on fast connections it occurs when two items are updated in rapid succession (e.g. ticking a checkbox while the name was just edited).

**Root cause:** `replication$` is a plain `Subject`. Every `MyCollection.update()` or `MyCollection.insert()` calls `replication$.next()`, which immediately triggers `push()`. The `push()` method queries the database for **all currently `touched` documents** and sends them in a batch:

```ts
// constructor wires every emission directly to push()
this.replicationSub = this.collection.replication$.subscribe(() => {
    this.push();   // no guard — starts a new push even if one is in flight
});
```

If two updates occur close together:

```
update(item1) → replication$.next() → push() starts → queries touched: [item1]
update(item2) → replication$.next() → push() starts CONCURRENTLY
                                        → queries touched: [item1, item2]
                                          (item1 not yet markUntouched)
```

Both concurrent pushes send `item1` to the server. The server calls `ListItemChanged::dispatch` once for each successful batch. `ItemChangedHandler` fires twice, both times finding `item1` in its payload → two push notifications are dispatched to all other list members.

**Fix:** Use an `isPushing` flag to ensure only one push is in flight at a time:

```ts
private isPushing = false;

public async push() {
    if (this.isPushing || !this.pushOptions) return;
    this.isPushing = true;
    try {
        // ... existing push logic ...
    } finally {
        this.isPushing = false;
    }
}
```

A dirty flag should be set whenever `replication$.next()` fires while `isPushing` is `true`, so that a follow-up push is triggered automatically when the in-flight push completes.

---

#### Bug G — Retry loop re-submits already-processed items on timeout, causing duplicate server dispatch

**Location:** `frontend/src/app/mydb/replication.ts` — `push()` — the `setInterval` retry block

**Root cause:** When the server processes a push request successfully but the HTTP response times out or fails on the client side, `pushInterval` throws and the catch block enters the retry loop:

```ts
this.pushInterval(docs).catch(err => {
    // retry every second with the ORIGINAL docs snapshot
    const pushInterval = setInterval(async () => {
        try {
            await this.pushInterval(docs);   // ← re-sends items already written to DB
            clearInterval(pushInterval);
        } catch { }
    }, 1 * 1000);
});
```

The `docs` array is a **snapshot taken before the first attempt**. If the server already upserted those items and dispatched `ListItemChanged`, the retry causes a second upsert + second dispatch → duplicate notification.

**Fix:** Call `markUntouched` only after the server response is confirmed (or the request definitively times out). Before each retry, re-query the database to check whether the items are still `touched`. Items that were successfully processed will have been `markUntouched`'d; only genuinely unsynced items should be retried:

```ts
this.pushInterval(docs).catch(() => {
    const retryInterval = setInterval(async () => {
        // re-read touched docs — avoids re-sending already-processed items
        const stillTouched = await this.collection.table
            .toCollection()
            .filter((d: any) => doc.touched && docs.some(orig => orig[pk] === d[pk]))
            .toArray();

        if (stillTouched.length === 0) {
            clearInterval(retryInterval);
            return;
        }

        try {
            await this.pushInterval(stillTouched);
            clearInterval(retryInterval);
        } catch { }
    }, 1_000);
});

```

---



#### Summary

| Bug         | Layer                       | Root cause                                                                                | Effect                                                              |
| ----------- | --------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **F** | Frontend `replication.ts` | No concurrency guard on `push()` — concurrent calls include the same `touched` items | Duplicate `ListItemChanged` dispatches → duplicate notifications |
| **G** | Frontend `replication.ts` | Retry uses original snapshot; server may have already processed the batch                 | Re-dispatch on timeout → duplicate notifications                   |
|             |                             |                                                                                           |                                                                     |

Fixing **F** (exhaustMap / isPushing flag) eliminates the most common source of duplicates. **G** is a defensive fix for timeout edge-cases.
