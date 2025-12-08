-- ============================================================================
-- SÉCURISATION RLS - Restreindre les modifications aux admins uniquement
-- ============================================================================

-- 🔐 OPTION 1 : Avec Service Role Key (Recommandé pour l'instant)
-- ============================================================
-- Pour l'instant, votre app utilise la clé "anon" qui ne peut PAS modifier
-- Pour permettre les modifications, vous devez utiliser la "Service Role Key"

-- ⚠️ IMPORTANT : Dans votre fichier .env, changez :
-- VITE_SUPABASE_ANON_KEY=eyJh... (clé anon actuelle)
-- PAR :
-- VITE_SUPABASE_ANON_KEY=eyJh... (Service Role Key depuis Supabase Dashboard)

-- Pour obtenir la Service Role Key :
-- 1. Allez sur https://supabase.com/dashboard
-- 2. Sélectionnez votre projet
-- 3. Settings (engrenage) → API
-- 4. Copiez "service_role" (secret!) dans Project API keys
-- 5. Remplacez dans .env

-- ⚠️⚠️⚠️ ATTENTION SÉCURITÉ ⚠️⚠️⚠️
-- La Service Role Key bypasse TOUTES les politiques RLS
-- Ne JAMAIS l'exposer côté client en production
-- Pour production, implémentez l'Option 2 ci-dessous


-- ============================================================================
-- 🔐 OPTION 2 : Avec Supabase Auth (Pour la production - Plus sécurisé)
-- ============================================================================

-- 1. D'abord, supprimer l'ancienne politique UPDATE trop permissive
DROP POLICY IF EXISTS "Modification des thèmes" ON themes;

-- 2. Créer une table pour gérer les admins
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ajouter votre email admin
-- ⚠️ Remplacez 'votre-email@exemple.com' par votre vrai email
INSERT INTO admin_users (email) VALUES ('votre-email@exemple.com')
ON CONFLICT (email) DO NOTHING;

-- 4. Créer la politique UPDATE sécurisée
CREATE POLICY "Modification des thèmes par admins uniquement" 
ON themes FOR UPDATE 
USING (
  -- Vérifier que l'utilisateur est authentifié ET qu'il est dans la table admin_users
  auth.jwt() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt()->>'email'
  )
)
WITH CHECK (
  auth.jwt() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt()->>'email'
  )
);

-- 5. Même chose pour les autres tables sensibles
DROP POLICY IF EXISTS "Modification des campagnes" ON campaigns;
CREATE POLICY "Modification des campagnes par admins uniquement" 
ON campaigns FOR ALL
USING (
  auth.jwt() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt()->>'email'
  )
)
WITH CHECK (
  auth.jwt() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt()->>'email'
  )
);

DROP POLICY IF EXISTS "Modification des scénarios" ON scenarios;
CREATE POLICY "Modification des scénarios par admins uniquement" 
ON scenarios FOR ALL
USING (
  auth.jwt() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt()->>'email'
  )
)
WITH CHECK (
  auth.jwt() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt()->>'email'
  )
);


-- ============================================================================
-- 📝 NOTES D'IMPLÉMENTATION
-- ============================================================================

/*
POUR IMPLÉMENTER L'OPTION 2 (Supabase Auth), vous devrez :

1. Activer Email Auth dans Supabase :
   - Dashboard → Authentication → Providers
   - Activer "Email"

2. Modifier votre LoginPage.jsx pour utiliser Supabase Auth :
   
   import { supabase } from '../lib/supabase';
   
   const handleSubmit = async (e) => {
     e.preventDefault();
     
     const { data, error } = await supabase.auth.signInWithPassword({
       email: emailInput,
       password: passwordInput,
     });
     
     if (error) {
       setError('Email ou mot de passe incorrect');
       return;
     }
     
     // Vérifier si l'utilisateur est admin
     const { data: adminCheck } = await supabase
       .from('admin_users')
       .select('*')
       .eq('email', data.user.email)
       .single();
     
     if (!adminCheck) {
       await supabase.auth.signOut();
       setError('Accès non autorisé');
       return;
     }
     
     navigate('/admin');
   };

3. Modifier ProtectedRoute pour vérifier Supabase Auth :
   
   const ProtectedRoute = ({ children }) => {
     const [user, setUser] = useState(null);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       supabase.auth.getSession().then(({ data: { session } }) => {
         setUser(session?.user ?? null);
         setLoading(false);
       });
       
       const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
         setUser(session?.user ?? null);
       });
       
       return () => subscription.unsubscribe();
     }, []);
     
     if (loading) return <div>Chargement...</div>;
     if (!user) return <Navigate to="/login" replace />;
     
     return children;
   };

4. Créer les comptes utilisateurs dans Supabase :
   - Dashboard → Authentication → Users
   - Add user → Entrez email + password
   - Assurez-vous que l'email est dans la table admin_users
*/


-- ============================================================================
-- 🎯 RÉSUMÉ : Que faire maintenant ?
-- ============================================================================

/*
SOLUTION RAPIDE (Dev/Test) :
1. Utilisez la Service Role Key dans .env (Option 1)
2. ⚠️ NE JAMAIS faire ça en production !

SOLUTION SÉCURISÉE (Production) :
1. Exécutez les scripts de l'Option 2 ci-dessus
2. Modifiez LoginPage.jsx pour utiliser Supabase Auth
3. Créez vos comptes admin dans Supabase Dashboard
4. Testez que seuls les admins peuvent modifier

AVANTAGES de l'Option 2 :
✅ Sécurité maximale
✅ Gestion native des sessions
✅ Password reset automatique
✅ Multi-utilisateurs facile
✅ Logs d'authentification

INCONVÉNIENTS de l'Option 1 :
❌ Aucune sécurité en production
❌ Clé secrète exposée
❌ Tout le monde peut modifier si ils ont la clé
*/
