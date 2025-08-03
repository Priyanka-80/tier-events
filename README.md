# 🎉 Tier-Based Event Showcase

A full-stack web application built with **Next.js 14**, **Clerk Authentication**, **Supabase**, and **Tailwind CSS** that allows users to view events based on their tier (Free, Silver, Gold, Platinum), and gives admin control to manage events and user tiers.

## 🔐 Features

### 👥 Authentication (Clerk.dev)
- User sign-up / sign-in
- Admin recognition by email

### 🎯 Tier System
- Tiers: `Free`, `Silver`, `Gold`, `Platinum`
- Users are prompted to select their tier during first login
- Events are filtered based on tier access

### 🗓️ Event Showcase
- Admin can **add**, **edit**, and **delete** events
- Each event displays title, description, tier, date, and image
- Badge color changes based on event tier
- Tier filter buttons allow filtering visible events

### 🛠️ Admin Panel
- Admin (based on email) can:
  - Add new events
  - Edit existing events
  - Delete events
  - View all events across all tiers
  - Update any user's tier

---

## 🧰 Tech Stack

| Tool       | Description                           |
|------------|---------------------------------------|
| Next.js 14 | App directory structure, SSR/SSG      |
| Clerk.dev  | User authentication & session         |
| Supabase   | Backend database and storage          |
| Tailwind CSS | Fast and responsive styling        |
| TypeScript | Static typing for better safety       |

---

## 🚀 Getting Started (Local Setup)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Priyanka-80/tier-events.git
   cd tier-events
Install dependencies

bash
Copy
Edit
npm install
Create .env.local
Configure your Clerk and Supabase credentials:

env
Copy
Edit
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
Run the development server

Copy
Edit
npm run dev
Open http://localhost:3000 in your browser.

🖼️ Database Schema (Supabase)
events table:
Column	Type
id	integer (PK)
title	text
description	text
tier	text
event_date	date
image_url	text

user_tiers table:
Column	Type
user_id	text (Clerk user ID)
tier	text

✨ Screenshots
Dashboard with tier filter, event cards, and admin controls
Add screenshots here if available

👩‍💻 Author
Priyanka S M
GitHub: @Priyanka-80
