import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  EyeOff,
  Cookie,
  Users,
  Baby,
  KeyRound,
  Lock,
  FileText,
  Mail,
} from "lucide-react";

const SECTIONS = [
  { id: "collect", label: "1. What we collect", icon: FileText },
  { id: "no-collect", label: "2. What we don't do", icon: EyeOff },
  { id: "cookies", label: "3. Cookies & local storage", icon: Cookie },
  { id: "visibility", label: "4. Who can see your info", icon: Users },
  { id: "minors", label: "5. Minors", icon: Baby },
  { id: "rights", label: "6. Your rights & controls", icon: KeyRound },
  { id: "security", label: "7. Security", icon: Lock },
  { id: "changes", label: "8. Changes & contact", icon: Mail },
] as const;

// Honest, complete inventory of what Taskify writes to your browser.
// Each row matches a real key set somewhere in src/.
const STORAGE_ROWS: Array<{
  name: string;
  key: string;
  purpose: string;
  type: "Essential" | "Preference";
  lifetime: string;
}> = [
  {
    name: "Auth session",
    key: "sb-*-auth-token",
    purpose: "Keeps you signed in across page refreshes.",
    type: "Essential",
    lifetime: "Until you sign out",
  },
  {
    name: "Consent choice",
    key: "nl_cookie_consent_v2",
    purpose: "Remembers that you've seen the cookie banner.",
    type: "Essential",
    lifetime: "Until cleared",
  },
  {
    name: "Theme",
    key: "taskfy.theme",
    purpose: "Your light / dark / system appearance choice.",
    type: "Preference",
    lifetime: "Until changed",
  },
  {
    name: "Reduce motion",
    key: "settings.reduceMotion",
    purpose: "Disables decorative animations.",
    type: "Preference",
    lifetime: "Until changed",
  },
  {
    name: "Default filter",
    key: "tasks.verifiedOnly",
    purpose: "Pre-checks the verified-only filter on Browse Tasks.",
    type: "Preference",
    lifetime: "Until changed",
  },
  {
    name: "Welcome tour seen",
    key: "taskfy.tour.v1.<userId>",
    purpose: "Stops the first-run tour from re-opening on every login.",
    type: "Preference",
    lifetime: "Per account, until cleared",
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Privacy Policy — Taskify"
        description="How Taskify handles your data, what we store in your browser, and the controls you have. Plain language, no dark patterns."
        path="/privacy"
      />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-[calc(env(safe-area-inset-top)+5rem)] pb-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Plain-language privacy
          </div>
          <h1 className="text-4xl font-bold mb-3 text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            This page is maintained by the Taskify team to explain — in plain language —
            what data Taskify collects, how it's used, and the controls you have. It
            isn't legal advice or a third-party certification.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Last updated: June 2026
          </p>
        </div>

        {/* TL;DR pillars */}
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          <Pillar
            icon={EyeOff}
            title="No ad tracking"
            body="We don't run third-party advertising or cross-site tracking pixels."
          />
          <Pillar
            icon={ShieldCheck}
            title="No payment data"
            body="Taskify never holds your money. Payments are arranged off-app between users."
          />
          <Pillar
            icon={KeyRound}
            title="You're in control"
            body="Edit, export, or delete your profile and posts at any time from Settings."
          />
        </div>

        {/* Table of contents */}
        <Card className="mb-6">
          <CardContent className="py-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
              On this page
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                  >
                    <s.icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Body */}
        <Card>
          <CardContent className="py-8 space-y-10 text-sm leading-relaxed text-foreground">
            <Section id="collect" title="1. What we collect">
              <p>
                When you sign up we collect your <strong>name, email, age, optional
                location, profile photo, and bio</strong>. When you post a task or send
                a message we store that content so the other party can see it.
              </p>
              <p>
                When you use face verification, the video frames are processed
                <strong> in memory and immediately discarded</strong> — we never persist
                raw camera frames to disk or cloud storage. Only the verification
                outcome (approved / pending / rejected) is saved against your profile.
              </p>
            </Section>

            <Section id="no-collect" title="2. What we don't do">
              <ul className="list-disc pl-6 space-y-1.5">
                <li>We don't sell your data — to anyone, ever.</li>
                <li>We don't run third-party advertising or cross-site tracking pixels.</li>
                <li>
                  We don't collect or store payment information. Payments are arranged
                  and sent directly between users off-app, outside of Taskify.
                </li>
                <li>We don't store the raw camera frames used for age verification.</li>
              </ul>
            </Section>

            <Section id="cookies" title="3. Cookies & local storage">
              <p>
                Taskify uses only first-party cookies and browser local storage — no
                third-party trackers. Every item below is set by Taskify itself for the
                purpose described. You can clear all of them at any time from your
                browser, and revisit your choices from{" "}
                <Link to="/settings" className="text-primary underline">
                  Settings
                </Link>
                .
              </p>

              <div className="overflow-x-auto -mx-4 sm:mx-0 mt-4">
                <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                  <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="text-left font-semibold px-3 py-2">Name</th>
                      <th className="text-left font-semibold px-3 py-2">Purpose</th>
                      <th className="text-left font-semibold px-3 py-2 hidden sm:table-cell">Type</th>
                      <th className="text-left font-semibold px-3 py-2 hidden md:table-cell">Lifetime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STORAGE_ROWS.map((row) => (
                      <tr key={row.key} className="border-t border-border align-top">
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-foreground">{row.name}</div>
                          <code className="text-[10px] text-muted-foreground break-all">
                            {row.key}
                          </code>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{row.purpose}</td>
                        <td className="px-3 py-2.5 hidden sm:table-cell">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              row.type === "Essential"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell">
                          {row.lifetime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section id="visibility" title="4. Who can see your info">
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Your name, photo, bio, and skills are visible on your public profile.</li>
                <li>
                  Your age and precise location are protected — revealed only when an
                  offer you've sent is accepted by the task poster.
                </li>
                <li>Direct messages are visible only to the sender and the recipient.</li>
                <li>Verification photos are visible only to platform admins for review.</li>
              </ul>
            </Section>

            <Section id="minors" title="5. Minors">
              <p>
                Users under 18 are flagged with a <strong>Young Neighbor</strong> badge
                so task posters know they're working with a minor. Some features (such
                as task posting) require parental approval. Parents or guardians may
                contact us at any time to request deletion of a minor's account.
              </p>
            </Section>

            <Section id="rights" title="6. Your rights & controls">
              <p>You can, at any time:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  Edit your profile, change your avatar, or delete your account from{" "}
                  <Link to="/settings" className="text-primary underline">
                    Settings
                  </Link>
                  .
                </li>
                <li>Remove tasks, offers, or messages you've created.</li>
                <li>
                  Adjust theme, motion, and default filter preferences from{" "}
                  <Link to="/settings" className="text-primary underline">
                    Settings
                  </Link>
                  .
                </li>
                <li>
                  Request a full export or deletion of your data via the{" "}
                  <Link to="/contact" className="text-primary underline">
                    Contact page
                  </Link>
                  .
                </li>
              </ul>
            </Section>

            <Section id="security" title="7. Security">
              <p>
                Sensitive fields are protected by row-level security on the database and
                accessed only through audited stored procedures. Passwords are hashed by
                our managed authentication provider — Taskify never sees the plain text.
                The Lovable Cloud platform provides the hosting and database layer; this
                page describes our app-level practices and is not a third-party security
                certification.
              </p>
            </Section>

            <Section id="changes" title="8. Changes & contact">
              <p>
                If we materially change this policy we'll update the "Last updated" date
                at the top of the page and notify active users by email.
              </p>
              <p>
                Questions, deletion requests, or anything else? Reach us via the{" "}
                <Link to="/contact" className="text-primary underline">
                  Contact page
                </Link>
                .
              </p>
            </Section>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function Pillar({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2.5">
        <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
      </div>
      <p className="font-semibold text-sm text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
