import { NewsletterForm } from "./NewsletterForm";
import { newsletterIds } from "@/lib/brevo";

/**
 * Formularz zapisu pokazujemy na produkcji dopiero wtedy, gdy newsletter jest podłączony (numer listy w data/newsletter.json po `setup`).
 * Dzięki temu scalenie kodu przed konfiguracją Brevo nie zostawia na stronie formularza, który odpowiada "niedostępny".
 * Na podglądach Vercela i lokalnie formularz widać zawsze, żeby dało się go obejrzeć.
 */
export const newsletterLive = () => !!newsletterIds().listId || process.env.VERCEL_ENV !== "production";

export function NewsletterSignup(props: { compact?: boolean; where?: string }) {
  return newsletterLive() ? <NewsletterForm {...props} /> : null;
}
