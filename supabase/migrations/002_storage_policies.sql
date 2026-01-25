-- Storage Policies for ProjectSign
-- Run this in your Supabase SQL Editor

-- Images bucket policies
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Anyone can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'images');

-- Signatures bucket policies
CREATE POLICY "Anyone can upload signatures"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Anyone can view signatures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'signatures');

-- PDFs bucket policies
CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pdfs');

CREATE POLICY "Anyone can view PDFs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'pdfs');

CREATE POLICY "Authenticated users can delete PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'pdfs');
