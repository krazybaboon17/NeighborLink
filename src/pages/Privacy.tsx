import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Privacy Policy — Taskfy"
        description="How Taskfy handles your data, including face verification frames that are processed in-memory and never stored."
        path="/privacy"
      />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-[calc(env(safe-area-inset-top)+5rem)] pb-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: April 2026</p>

        <Card>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none py-8 space-y-6 text-sm leading-relaxed text-foreground">
            <section>
              <h2 className="text-xl font-semibold">1. What we collect</h2>
              <p>
                When you sign up we collect your name, email, age, optional
                location, profile photo, and bio. When you post a task or send a
                message we store that content so the other party can see it. When
                you use face verification, the video frames are processed in
                memory and immediately discarded — we never persist them to disk
                or cloud storage.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">2. What we don't collect</h2>
              <p>
                We don't sell your data. We don't run third-party advertising
                trackers. We don't collect or store any payment information —
                payments are arranged and sent directly between users off-app,
                outside of Taskfy. We don't store the camera frames used for age
                verification.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">3. Cookies & local storage</h2>
              <p>
                We use essential cookies and local storage to keep you signed in
                and to remember preferences such as your saved location and
                distance filter. We do not use advertising or cross-site tracking
                cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">4. Who can see your info</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your name, photo, bio, and skills are visible on your public profile.</li>
                <li>Your age and location are protected — only revealed when an offer you've sent is accepted.</li>
                <li>Direct messages are only visible to the sender and the recipient.</li>
                <li>Verification photos are visible only to platform admins for review.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">5. Minors</h2>
              <p>
                Users under 18 are flagged with a Young Neighbor badge so task
                posters know they're working with a minor. Parents or guardians
                may contact us at any time to request deletion of a minor's
                account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">6. Your rights</h2>
              <p>
                You can edit your profile, delete your account, and remove tasks
                or messages you've created at any time. To request a full export
                or deletion of your data, reach us via the contact page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">7. Security</h2>
              <p>
                Sensitive fields are protected by row-level security and accessed
                only through audited stored procedures. Passwords are hashed by
                our authentication provider.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">8. Changes</h2>
              <p>
                If we materially change this policy we'll update the "Last
                updated" date and notify active users by email.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">9. Contact</h2>
              <p>
                Questions? Reach out via the <a href="/contact" className="text-primary underline">Contact page</a>.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
