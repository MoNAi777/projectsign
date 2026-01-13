-- ProjectSign Database Schema
-- Run this in your Supabase SQL Editor

-- Create enums
CREATE TYPE project_status AS ENUM (
  'draft',
  'quote_sent',
  'approved',
  'in_progress',
  'completed',
  'paid',
  'cancelled'
);

CREATE TYPE form_type AS ENUM (
  'quote',
  'work_approval',
  'completion',
  'payment'
);

CREATE TYPE payment_method AS ENUM (
  'cash',
  'check',
  'transfer',
  'credit',
  'bit'
);

-- Projects Table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status project_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Contacts Table (one per project)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_project_id ON contacts(project_id);

-- Forms Table
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  type form_type NOT NULL,
  data JSONB DEFAULT '{}',
  signature_url TEXT,
  signature_hash TEXT,
  signed_at TIMESTAMPTZ,
  signed_by TEXT,
  signer_ip TEXT,
  signer_user_agent TEXT,
  pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  sent_via TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forms_project_id ON forms(project_id);
CREATE INDEX idx_forms_type ON forms(type);

-- Images Table
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  form_id UUID REFERENCES forms ON DELETE SET NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_images_project_id ON images(project_id);
CREATE INDEX idx_images_form_id ON images(form_id);

-- Signing Tokens Table
CREATE TABLE signing_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_ip TEXT,
  used_user_agent TEXT,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signing_tokens_token ON signing_tokens(token);
CREATE INDEX idx_signing_tokens_form_id ON signing_tokens(form_id);
CREATE INDEX idx_signing_tokens_expires_at ON signing_tokens(expires_at);

-- Updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_tokens ENABLE ROW LEVEL SECURITY;

-- Projects Policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Contacts Policies
CREATE POLICY "Users can view contacts of own projects" ON contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = contacts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contacts to own projects" ON contacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = contacts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contacts of own projects" ON contacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = contacts.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contacts of own projects" ON contacts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = contacts.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Forms Policies
CREATE POLICY "Users can view forms of own projects" ON forms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = forms.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert forms to own projects" ON forms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = forms.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update forms of own projects" ON forms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = forms.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete forms of own projects" ON forms
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = forms.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Images Policies
CREATE POLICY "Users can view images of own projects" ON images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = images.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert images to own projects" ON images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = images.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images of own projects" ON images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = images.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Signing Tokens - Service role only (no user policies)
-- All access through API with service role key

-- Storage Buckets (run separately in Supabase Dashboard > Storage)
-- Create buckets: signatures, images, pdfs
-- Then set policies via Dashboard or SQL

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT DO NOTHING;
