CREATE OR REPLACE FUNCTION public.admin_get_platform_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  SELECT jsonb_build_object(
    'users_total',          (SELECT count(*) FROM public.profiles),
    'users_helpers',        (SELECT count(*) FROM public.profiles WHERE is_helper = true),
    'users_verified',       (SELECT count(*) FROM public.profiles WHERE verified = true),
    'users_young_neighbors',(SELECT count(*) FROM public.profiles WHERE is_young_neighbor = true),
    'users_email_verified', (SELECT count(*) FROM public.profiles WHERE email_verified = true),
    'users_phone_verified', (SELECT count(*) FROM public.profiles WHERE phone_verified = true),
    'users_with_bio',       (SELECT count(*) FROM public.profiles WHERE bio IS NOT NULL AND length(trim(bio)) > 0),
    'users_with_skills',    (SELECT count(*) FROM public.profiles WHERE skills IS NOT NULL AND array_length(skills,1) > 0),
    'users_new_7d',         (SELECT count(*) FROM public.profiles WHERE created_at >= now() - interval '7 days'),
    'users_new_30d',        (SELECT count(*) FROM public.profiles WHERE created_at >= now() - interval '30 days'),
    'admins_total',         (SELECT count(*) FROM public.user_roles WHERE role = 'admin'),
    'offers_total',         (SELECT count(*) FROM public.offers),
    'offers_accepted',      (SELECT count(*) FROM public.offers WHERE status = 'accepted'),
    'offers_pending',       (SELECT count(*) FROM public.offers WHERE status = 'pending'),
    'offers_rejected',      (SELECT count(*) FROM public.offers WHERE status = 'rejected'),
    'unique_helpers_applied',(SELECT count(DISTINCT helper_id) FROM public.offers),
    'messages_total',       (SELECT count(*) FROM public.messages),
    'messages_7d',          (SELECT count(*) FROM public.messages WHERE created_at >= now() - interval '7 days'),
    'conversations',        (SELECT count(*) FROM (SELECT DISTINCT task_id, least(sender_id,receiver_id) a, greatest(sender_id,receiver_id) b FROM public.messages) x),
    'reviews_total',        (SELECT count(*) FROM public.reviews),
    'reviews_avg_rating',   (SELECT COALESCE(round(avg(rating)::numeric, 2), 0) FROM public.reviews),
    'volunteer_hours_total',(SELECT COALESCE(round(sum(hours)::numeric, 1), 0) FROM public.volunteer_hours),
    'volunteer_entries',    (SELECT count(*) FROM public.volunteer_hours),
    'volunteers_unique',    (SELECT count(DISTINCT user_id) FROM public.volunteer_hours),
    'verifications_pending',(SELECT count(*) FROM public.verifications WHERE status = 'pending'),
    'verifications_approved',(SELECT count(*) FROM public.verifications WHERE status = 'approved'),
    'verifications_rejected',(SELECT count(*) FROM public.verifications WHERE status = 'rejected'),
    'reports_total',        (SELECT count(*) FROM public.task_reports),
    'reports_open',         (SELECT count(*) FROM public.task_reports WHERE status = 'pending'),
    'mailing_subscribers',  (SELECT count(*) FROM public.mailing_list),
    'favorites_total',      (SELECT count(*) FROM public.favorite_helpers),
    'time_slots_total',     (SELECT count(*) FROM public.task_time_slots),
    'parental_consents',    (SELECT count(*) FROM public.parental_consents)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_platform_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_platform_stats() TO authenticated;