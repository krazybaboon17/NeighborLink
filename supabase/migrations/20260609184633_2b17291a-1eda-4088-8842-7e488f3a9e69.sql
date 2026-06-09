
-- Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prefer_verified_only boolean NOT NULL DEFAULT false;

-- Messages: voice notes
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS voice_url text,
  ADD COLUMN IF NOT EXISTS voice_duration_seconds integer;

-- Favorite helpers
CREATE TABLE IF NOT EXISTS public.favorite_helpers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  helper_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, helper_id),
  CHECK (user_id <> helper_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorite_helpers TO authenticated;
GRANT ALL ON public.favorite_helpers TO service_role;
ALTER TABLE public.favorite_helpers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own favorites or favorites of them"
  ON public.favorite_helpers FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = helper_id);
CREATE POLICY "Users add own favorites"
  ON public.favorite_helpers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own favorites"
  ON public.favorite_helpers FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_helpers_user ON public.favorite_helpers(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_helpers_helper ON public.favorite_helpers(helper_id);

-- Message reactions
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view reactions"
  ON public.message_reactions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_reactions.message_id
        AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
    )
  );
CREATE POLICY "Users add own reactions"
  ON public.message_reactions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_reactions.message_id
        AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
    )
  );
CREATE POLICY "Users remove own reactions"
  ON public.message_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);

-- Enable realtime on reactions
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'message_reactions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions';
  END IF;
END$$;

-- Mark email as verified for already-confirmed users
UPDATE public.profiles p
SET email_verified = true
FROM auth.users u
WHERE p.id = u.id AND u.email_confirmed_at IS NOT NULL AND p.email_verified = false;

-- Trigger to sync email_verified from auth.users
CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at) THEN
    UPDATE public.profiles SET email_verified = true WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_email_verified();
