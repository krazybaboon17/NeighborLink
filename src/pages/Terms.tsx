import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: April 2026</p>

        <Card>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none py-8 space-y-6 text-sm leading-relaxed text-foreground">
            <section>
              <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
              <p>
                By posting tasks, sending offers, accepting offers, or otherwise using
                TaskIt! ("the Platform"), you agree to be bound by these Terms of
                Service. If you do not agree, do not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">2. Eligibility & Minors</h2>
              <p>
                Users under 18 ("Young Neighbors") may participate only with parental or
                guardian consent. Minors must not perform tasks that are unsafe,
                involve hazardous materials or equipment, or take place in private
                residences without an adult present. Task posters acknowledge they may
                be working with minors and accept responsibility for providing a safe
                environment.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">3. Marketplace Role</h2>
              <p>
                TaskIt! is a peer-to-peer community marketplace. We do not employ
                helpers, do not perform tasks ourselves, and are not a party to any
                agreement between users. All arrangements, payments, and task
                completion are solely between the requester and the helper.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">4. Payments (Zelle)</h2>
              <p>
                Payments are made directly between users via Zelle. TaskIt! does
                not process or hold funds. A 10% platform fee may be requested
                separately. You are responsible for verifying the recipient's Zelle ID
                before sending money. Zelle transfers are typically irreversible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">5. User Conduct</h2>
              <p>You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Post illegal, dangerous, sexually explicit, or harassing content.</li>
                <li>Solicit minors for inappropriate or unsafe activities.</li>
                <li>Misrepresent your identity, age, skills, or location.</li>
                <li>Use the Platform to circumvent payment, verification, or safety systems.</li>
                <li>Share personal contact info publicly to bypass in-app messaging.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">6. Safety & Verification</h2>
              <p>
                Verification badges indicate a user has completed AI-assisted identity
                checks but do not guarantee safety. You are responsible for meeting in
                safe, public, or supervised settings, especially when minors are
                involved. Report suspicious behavior immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">7. Disputes</h2>
              <p>
                Disputes between users must be resolved between the parties directly.
                TaskIt! may, at its discretion, suspend accounts but is not
                obligated to mediate, refund, or arbitrate disputes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">8. Liability</h2>
              <p>
                The Platform is provided "as is" without warranties of any kind.
                TaskIt! is not liable for any damages, injuries, losses, or
                disputes arising from your use of the Platform or interactions with
                other users. You use the Platform at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">9. Privacy</h2>
              <p>
                Camera frames used for face verification are processed in-memory and
                never stored. Personal information (Zelle ID, age, location) is
                protected by access controls and only shared as necessary to complete
                a task.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">10. Termination</h2>
              <p>
                We may suspend or terminate accounts that violate these Terms or that
                pose a risk to community safety, with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">11. Changes</h2>
              <p>
                We may update these Terms at any time. Continued use of the Platform
                after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">12. Contact</h2>
              <p>
                Questions? Reach us via the <a href="/contact" className="text-primary underline">Contact page</a>.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
