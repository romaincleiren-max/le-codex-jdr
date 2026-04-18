-- ============================================================================
-- SÉCURITÉ : Protection des champs sensibles contre les joueurs
-- Problème 1 : characters_update_player permet aux joueurs de modifier
--              level_up_pending et level directement (privilege escalation)
-- Problème 2 : level peut être mis à n'importe quelle valeur côté client
-- ============================================================================

-- Trigger appelé BEFORE UPDATE sur characters
-- Règles :
--   • level_up_pending ne peut passer à TRUE que par un admin
--   • level ne peut augmenter que de 1, et uniquement si level_up_pending était TRUE
--     (ou si l'appelant est admin)

CREATE OR REPLACE FUNCTION public.enforce_level_up_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  caller_is_admin BOOLEAN;
BEGIN
  -- Vérifier si l'appelant est admin
  caller_is_admin := EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = (auth.jwt()->>'email')
  );

  -- Règle 1 : level_up_pending = TRUE uniquement pour les admins
  IF NEW.level_up_pending = true AND OLD.level_up_pending IS DISTINCT FROM true THEN
    IF NOT caller_is_admin THEN
      RAISE EXCEPTION 'Seul un administrateur peut accorder une montée de niveau.';
    END IF;
  END IF;

  -- Règle 2 : level ne peut changer que de +1 et seulement si level_up_pending était TRUE ou admin
  IF NEW.level IS DISTINCT FROM OLD.level THEN
    IF NOT caller_is_admin THEN
      IF NEW.level != OLD.level + 1 THEN
        RAISE EXCEPTION 'Le niveau ne peut augmenter que de 1 à la fois.';
      END IF;
      IF OLD.level_up_pending IS NOT TRUE THEN
        RAISE EXCEPTION 'Aucune montée de niveau accordée par l''administrateur.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$func$;

-- Appliquer le trigger
DROP TRIGGER IF EXISTS enforce_level_up_rules ON public.characters;
CREATE TRIGGER enforce_level_up_rules
  BEFORE UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_level_up_rules();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger enforce_level_up_rules créé sur characters';
  RAISE NOTICE '→ level_up_pending = TRUE : réservé aux admins';
  RAISE NOTICE '→ level : +1 max, seulement si level_up_pending était TRUE';
END $$;
