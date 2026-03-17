# Sacrament Speaker Tracker

A local web app for ward second counselors (and bishopric) to track sacrament meeting speakers, manage calling cadences, and plan upcoming meetings.

## Features

- **Speaker queue** with color-coded due status: red (overdue), amber (due soon), blue (coming up), green (active)
- **Adult & Youth** speaker categories (determined automatically by birth date)
- **Per-speaker cadence** setting — every 3, 6, 9, 12, 18, 24, or 36 months
- **Speaking history** — full log of dates and topics per person
- **Household grouping** — avoid scheduling the same family back-to-back
- **Meeting planner** — plan upcoming Sundays, assign speakers and topics, reorder
- **Contact info** (phone, email) and notes per member
- **Role-based access** — Bishop, Counselor, Clerk
- **Export** — CSV download + printable PDF pages for queue, roster, and history
- **Local SQLite database** — all data stays on your machine

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. First-time setup

On first launch you'll be taken to the setup page to create your administrator (Bishop) account. After that, sign in and begin adding ward members.

## Roles

| Role | Permissions |
|------|-------------|
| **Bishop** | Full access — add/edit/delete members, meetings, users, speaking records |
| **Counselor** | Add/edit members, log records, plan meetings. Cannot delete members or manage users |
| **Clerk** | Read-only view of all data |

## Running in Production

```bash
npm run build
npm start
```

The SQLite database is stored at `data/church.db` in the project folder. Back it up regularly.

## Environment

Copy `.env.local` and set a strong `JWT_SECRET` before sharing access:

```
JWT_SECRET=your-random-secret-here
```
