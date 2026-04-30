-- Nutritionist private notes per client; documents metadata + Storage bucket client-documents
-- nutritionist_id references public.nutritionists(id) (Clerk-linked UUID), not auth.users

CREATE TABLE IF NOT EXISTS public.nutritionist_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id uuid NOT NULL REFERENCES public.nutritionists(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  client_email text NOT NULL,
  session_number integer,
  content text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  is_visible_to_client boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nutritionist_notes_nutritionist_email_idx
  ON public.nutritionist_notes (nutritionist_id, client_email);
CREATE INDEX IF NOT EXISTS nutritionist_notes_created_idx
  ON public.nutritionist_notes (nutritionist_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id uuid NOT NULL REFERENCES public.nutritionists(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_email text NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_url text,
  file_type text,
  file_size_kb integer,
  description text,
  session_number integer,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_documents_nutritionist_email_idx
  ON public.client_documents (nutritionist_id, client_email);

ALTER TABLE public.nutritionist_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nutritionist_notes_clerk_own" ON public.nutritionist_notes;
DROP POLICY IF EXISTS "client_documents_clerk_own" ON public.client_documents;

-- Match Clerk user id on nutritionists when JWT sub is Clerk user id (optional client usage; server uses service role).
CREATE POLICY "nutritionist_notes_clerk_own"
  ON public.nutritionist_notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.nutritionists n
      WHERE n.id = nutritionist_notes.nutritionist_id
        AND n.clerk_user_id IS NOT NULL
        AND n.clerk_user_id = (auth.jwt() ->> 'sub')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nutritionists n
      WHERE n.id = nutritionist_notes.nutritionist_id
        AND n.clerk_user_id IS NOT NULL
        AND n.clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "client_documents_clerk_own"
  ON public.client_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.nutritionists n
      WHERE n.id = client_documents.nutritionist_id
        AND n.clerk_user_id IS NOT NULL
        AND n.clerk_user_id = (auth.jwt() ->> 'sub')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nutritionists n
      WHERE n.id = client_documents.nutritionist_id
        AND n.clerk_user_id IS NOT NULL
        AND n.clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Private bucket for nutritionist uploads (server uses service role + signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('client-documents', 'client-documents', false, 10485760, null)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;
