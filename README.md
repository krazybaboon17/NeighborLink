# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/26bdfb38-253a-40e1-b3be-865872cba2d8

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/26bdfb38-253a-40e1-b3be-865872cba2d8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/26bdfb38-253a-40e1-b3be-865872cba2d8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Supabase migration & storage setup

This project uses Supabase for Auth, Postgres and Storage. The repo includes a SQL migration that adds the `verifications` and `volunteer_hours` tables used by the verification and volunteering features. You must apply the migration and create a Storage bucket for uploads.

1. Apply the SQL migration

- Open your Supabase project and go to SQL Editor → New query.
- Copy the contents of `supabase/migrations/20251109020835_4d65fc20-44c7-4ad9-ab86-65a41c0297c1.sql` and run it. This migration also recreates a couple of helper triggers used by the project.

2. Create the Storage bucket

- In Supabase dashboard go to Storage → Create a new bucket named `verifications`.
- Configure public/private access according to your security needs. The client currently expects to read public URLs for preview in the admin UI; if you keep the bucket private, you can use signed URLs instead.

3. Environment variable for admin access (optional)

To make an admin link visible in the app without adding an `is_admin` column, set a comma-separated list of admin emails in a Vite env var named `VITE_ADMIN_EMAILS`.

Example `.env`:

```
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
VITE_ADMIN_EMAILS=admin@example.com,owner@example.com
```

4. Run the app

Install dependencies and start the dev server as usual:

```bash
npm i
npm run dev
```

After that you can open `/verify` to submit a verification (files are uploaded to the `verifications` bucket and a `verifications` row is inserted with status `pending`) and `/admin/verifications` (admin users only) to review and approve/reject submissions.
