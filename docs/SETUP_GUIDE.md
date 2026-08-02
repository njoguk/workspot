# WorkSpot Nairobi — One-Time Setup Guide

Complete these steps ONCE before Session 1.
Every command goes in Terminal (press Command+Space, type "Terminal", press Enter).
When you see `code like this`, type it exactly into Terminal and press Enter.

---

## Step 1: Verify Node.js

You already have Node.js. Confirm it:
```
node -v
npm -v
git --version
```
All three should show version numbers. If git is missing, install Xcode Command Line Tools:
```
xcode-select --install
```

---

## Step 2: Set Up Claude Code

Claude Code is Anthropic's AI coding agent. It writes and runs your code automatically.
You have two ways to use it. **The Desktop App is recommended for beginners.**

---

### Option A — Claude Desktop App (Recommended for beginners)

The Desktop App has Claude Code built in with a visual interface: a file editor,
diff viewer that shows exactly what changed, a side chat panel, and an integrated
terminal. You see the code being written in real time.

1. Download the Claude Desktop app: https://claude.com/download
2. Install it on your Mac (drag to Applications)
3. Sign in with your Anthropic account
4. Click the **Claude Code** icon in the sidebar (looks like a terminal prompt)
5. You're in — no configuration needed

To select your model in the desktop app:
- In the model selector (top of the Claude Code panel), choose **Claude Opus 4.8**
- Model ID: `claude-opus-4-8`

**How to run a session in the Desktop App:**
- Open Claude Code from the sidebar
- The app has its own terminal panel at the bottom
- Paste your session instruction into the chat (not the terminal)
- Claude Code will write files, run the terminal commands, and show you diffs
- Approve file changes by clicking "Accept" in the diff viewer

---

### Option B — Claude Code CLI (Traditional developer approach)

If you prefer the terminal or already have a development workflow:

```
npm install -g @anthropic-ai/claude-code
claude --version
```
Should show a version number.

Configure with your Anthropic API key:
```
claude config set api_key YOUR_API_KEY_HERE
```
Get your API key at: https://console.anthropic.com/settings/keys

Configure Opus 4.8:
```
claude config set model claude-opus-4-8
```

**How to run a session with the CLI:**
Open Terminal → `cd ~/workspot` → `claude` → paste your session instruction.

---

Both options produce identical results. The Desktop App is easier to learn;
the CLI is preferred by experienced developers.

---

## Step 3: Create the GitHub Repository

GitHub stores your code and enables Vercel to auto-deploy when you push changes.

1. Go to https://github.com and create a free account
2. Click "New repository" (the + button top right)
3. Name it: `workspot`
4. Set to Public (so Vercel can access it for free)
5. Don't add a README yet
6. Click "Create repository"

Configure git on your Mac (use the same email as GitHub):
```
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

Create your project folder and connect it to GitHub:
```
mkdir ~/workspot
cd ~/workspot
git init
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/workspot.git
```
Replace YOUR_GITHUB_USERNAME with your actual GitHub username.

---

## Step 4: Create the Supabase Project

Supabase is your database and backend. Free tier is plenty for launch.

1. Go to https://supabase.com and create a free account
2. Click "New project"
3. Choose a name: `workspot`
4. Choose a strong database password (save it somewhere safe)
5. Choose region: closest to Kenya (use EU West or Middle East if Africa not available)
6. Click "Create new project" — takes about 2 minutes

Get your credentials:
1. In your project, go to Settings → API
2. Copy "Project URL" — this is your VITE_SUPABASE_URL
3. Copy "anon public" key under "Project API keys" — this is your VITE_SUPABASE_ANON_KEY

Keep these safe. You'll use them in Step 6.

Run the database schema:
1. In Supabase, click "SQL Editor" in the left sidebar
2. Copy ALL the SQL from the SCHEMA.md file (everything between the ```sql blocks)
3. Paste it into the SQL editor and click "Run"
4. Do this section by section in order: profiles table, spots table, checkins, review_schemas, reviews, events, rsvps, bookings, venue_settings, then RLS policies
5. Finally run the review_schemas seed data INSERT statement

---

## Step 5: Create the Vercel Account

Vercel hosts your app. Free tier is all you need to start.

1. Go to https://vercel.com and sign up (use your GitHub account)
2. Click "Add New Project"
3. Select your `workspot` GitHub repository
4. Configure:
   - Framework Preset: Vite (Vercel should auto-detect)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
5. Add Environment Variables (before deploying):
   - Click "Environment Variables"
   - Add: `VITE_SUPABASE_URL` = your Supabase project URL
   - Add: `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click "Deploy"

Vercel will try to build and fail (no code yet) — that's fine. Once Session 1
pushes code, it will auto-deploy successfully.

---

## Step 6: Set Up Local Environment and Project Docs

Create your local environment file:
```
cd ~/workspot
touch .env.local
```

Open it in a text editor and add:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
```
Replace with your real values from Steps 4 and 6.

**Copy the project docs into your codebase:**

Claude Code reads files from your local project folder — it cannot
access the Claude Project uploads directly. Copy all the project
markdown files into a `docs/` folder in your project:

```
mkdir -p ~/workspot/docs
```

Then copy these files into `~/workspot/docs/`:
- CONFIG.md
- DESIGN_SYSTEM.md
- WORKSPOT.md
- SCHEMA.md
- BUILD_PLAN.md

Also copy `CLAUDE.md` into the project root (`~/workspot/CLAUDE.md`).
This file is read automatically by Claude Code at the start of every
session — it tells Claude where the design system is, what the platform
name is, and the core rules for the whole project.

Your project folder should look like:
```
~/workspot/
  CLAUDE.md           ← auto-read by Claude Code every session
  docs/
    CONFIG.md
    DESIGN_SYSTEM.md
    WORKSPOT.md
    SCHEMA.md
    BUILD_PLAN.md
  .env.local
  .gitignore
```

Add the docs to `.gitignore` if you want to keep them private,
or commit them to the repo so collaborators have access.

---

## Step 7: Create the Claude Project

This is your WorkSpot HQ — every chat here has full product context.

1. Go to claude.ai
2. Click "Projects" in the left sidebar (or the + New Project button)
3. Click "New Project"
4. Name it: `WorkSpot Nairobi Build`
5. Click on the project, then click "Project Instructions" (or Settings)
6. Paste the following as your project instructions:

---

**PROJECT INSTRUCTIONS TO PASTE:**

```
You are the lead developer for WorkSpot Nairobi — a curated marketplace where remote workers in Nairobi discover, check in, review, and book workspace sessions at cafés, hotel lobbies, gardens, and coworking spaces across Nairobi, Kenya.

The user (Sam) is a product designer and entrepreneur who is a complete beginner in programming. Your job is to build this entire product for him using Claude Code CLI on his Mac.

ALWAYS read the project files before responding:
- WORKSPOT.md — complete product brief, design system, all spot mock data
- SCHEMA.md — complete Supabase database schema, RLS policies, seed data
- BUILD_PLAN.md — 7-session build sequence with exact instructions
- SETUP_GUIDE.md — one-time Mac setup instructions

TECH STACK: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Supabase + React Router v6 + React Query + Framer Motion. Mobile-first always.

MODEL: Use Claude Opus 4.8 (claude-opus-4-8). Fable 5 has been suspended by US government order. Opus 4.8 has the same 1M context window and 128K output tokens.

COMMUNICATION RULES:
- Never use jargon without explaining it briefly
- Always say what a command does before asking Sam to run it
- When something could break, warn him first
- Always say what the expected result is after each step
- When Sam pastes an error, diagnose it clearly and give the exact fix to run in Claude Code

CODE STANDARDS:
- TypeScript only, no JavaScript files
- Production-quality code at all times
- Mobile-first (375px baseline)
- Real data, never placeholders in final components
- Always handle loading states with skeletons
- Always handle error states with friendly messages
- Accessible: keyboard navigation, ARIA labels on interactive elements
```

---

7. Upload files to the project:
   - Click "Add files to project" (or the attachment icon)
   - Upload all 4 markdown files: WORKSPOT.md, SCHEMA.md, BUILD_PLAN.md, SETUP_GUIDE.md

---

## Step 8: How to Run a Build Session

When you're ready to start a session:

1. Open Terminal: Command+Space → "Terminal" → Enter
2. Go to your project: `cd ~/workspot`
3. Start Claude Code: `claude`
4. Copy the session instruction from BUILD_PLAN.md
5. Paste it and press Enter
6. Claude Code will write all the code automatically
7. When it prompts you to approve running commands, type `y` and press Enter
8. Wait for it to finish (sessions take 30–90 minutes)
9. When it says "complete", verify using the checklist in BUILD_PLAN.md
10. Commit and push: `git add . && git commit -m "Session X done" && git push`

**You never need to write code.** Claude Code does everything.

---

## Paystack Setup (for Session 6 only)

You'll need this for payments. Do this when you reach Session 6.

### Get your Paystack API keys (takes 5 minutes)

1. Go to https://paystack.com and create a free account
2. Go to Settings → API Keys & Webhooks in your Paystack dashboard
3. Copy your **Test Public Key** (starts with pk_test_)
4. Copy your **Test Secret Key** (starts with sk_test_)
5. Test keys work immediately — no approval needed

### Add keys to your project

Add to .env.local (frontend, safe to use in browser):
```
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
```

Add to Supabase secrets (backend only — never in browser):
- In Supabase Dashboard → Settings → Secrets → Add new secret
- Name: PAYSTACK_SECRET_KEY
- Value: sk_test_your_key_here

### Register your webhook URL

In Paystack Dashboard → Settings → API Keys & Webhooks:
- Webhook URL: https://[your-project-ref].supabase.co/functions/v1/paystack-webhook
- Enable events: charge.success, charge.failed, transfer.success
- Click Save

### Test payment credentials (sandbox)

M-Pesa phone number: 0708000000
M-Pesa PIN: any 4 digits
OTP: any 6 digits
Expected: charge.success event fires, test transaction appears in dashboard

### Going live (before launch)

Paystack requires business verification before enabling live keys:
- Kenyan business registration certificate
- KRA PIN certificate
- Business bank account details
- Government-issued ID of a director

Start the verification early — it typically takes 3–7 business days.
You can build and test everything with sandbox keys while waiting.

---

## Useful Terminal Commands

```bash
# Start the development server (see your app in browser at localhost:5173)
npm run dev

# Check for TypeScript errors
npm run build

# Stop the dev server
Control + C

# Check what's changed (before committing)
git status

# Commit all changes with a message
git add . && git commit -m "describe what changed"

# Push to GitHub (triggers Vercel deploy)
git push origin main

# Start Claude Code
claude

# Exit Claude Code
/exit or Control + C
```

---

## If Something Goes Wrong

**"Permission denied" errors:** Run the command with `sudo` before it.
Example: `sudo npm install -g @anthropic-ai/claude-code`

**Claude Code says "rate limited":** Wait 1 minute and try again.

**Build fails on Vercel:** Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are
set in Vercel Environment Variables (Settings → Environment Variables).

**Supabase says "relation does not exist":** You haven't run that SQL migration yet.
Go back to SCHEMA.md and run the missing CREATE TABLE statement in Supabase SQL Editor.

**App works locally but not on Vercel:** This is almost always an environment variable
issue. Double-check all VITE_ prefixed variables are set in Vercel.

**Can't figure out what's wrong:** Paste the error into your WorkSpot Claude Project.
Include: what you were doing, what you expected, and the full error message.
