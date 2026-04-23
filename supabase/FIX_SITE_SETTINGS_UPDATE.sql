-- ============================================================================
-- FIX : Permettre aux admins de modifier site_settings
-- ============================================================================

-- Supprimer toutes les policies UPDATE existantes sur site_settings
DROP POLICY IF EXISTS "Autoriser modification paramètres" ON public.site_settings;
DROP POLICY IF EXISTS "Modification paramètres par admins" ON public.site_settings;

-- Recréer une policy UPDATE simple pour les utilisateurs authentifiés admins
CREATE POLICY "Admins peuvent modifier paramètres" ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- S'assurer que authenticated peut faire SELECT aussi
GRANT SELECT, UPDATE ON public.site_settings TO authenticated;

-- Vérification
SELECT policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'site_settings';
