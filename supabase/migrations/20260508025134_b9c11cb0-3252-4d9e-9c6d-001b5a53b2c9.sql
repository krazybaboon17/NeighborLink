-- Profiles: Stripe Connect tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  payer_user_id uuid NOT NULL,
  payee_user_id uuid NOT NULL,
  amount_total integer NOT NULL,           -- cents, what payer is charged
  amount_helper integer NOT NULL,          -- cents, sent to connected account
  amount_platform_fee integer NOT NULL,    -- cents, application fee (10%)
  stripe_payment_intent_id text UNIQUE,
  stripe_transfer_id text,
  status text NOT NULL DEFAULT 'pending',  -- pending | succeeded | failed
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payer or payee can view payment"
  ON public.payments FOR SELECT
  USING (auth.uid() = payer_user_id OR auth.uid() = payee_user_id);

-- No client INSERT/UPDATE/DELETE policies — backend (service role) only.

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_payments_task ON public.payments(task_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON public.payments(payer_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee ON public.payments(payee_user_id);