-- Drop payment-related RPC functions
DROP FUNCTION IF EXISTS public.get_helper_zelle_id(uuid, uuid);
DROP FUNCTION IF EXISTS public.set_helper_zelle_id(uuid, uuid, text);

-- Drop payments table
DROP TABLE IF EXISTS public.payments CASCADE;

-- Drop payment-related profile columns
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS zelle_id,
  DROP COLUMN IF EXISTS stripe_account_id,
  DROP COLUMN IF EXISTS stripe_onboarding_complete,
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS payment_banner_dismissed;

-- Add is_read to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
  ON public.messages(receiver_id) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_messages_task_pair
  ON public.messages(task_id, sender_id, receiver_id, created_at DESC);

-- Allow receivers to mark their messages as read
CREATE POLICY "Receivers can mark messages read"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);