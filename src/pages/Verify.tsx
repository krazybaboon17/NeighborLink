import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Verify() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const onIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdFile(e.target.files?.[0] || null);
  };
  const onSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelfieFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to verify');
      navigate('/auth');
      return;
    }

    if (!idFile || !selfieFile) {
      toast.error('Please upload both an ID image and a selfie');
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const idPath = `${user.id}/id_${timestamp}_${idFile.name}`;
      const selfiePath = `${user.id}/selfie_${timestamp}_${selfieFile.name}`;

      const bucket = 'verifications';

      // upload id image
      const { error: idErr } = await supabase.storage.from(bucket).upload(idPath, idFile, { upsert: true });
      if (idErr) throw idErr;

      const { error: selfieErr } = await supabase.storage.from(bucket).upload(selfiePath, selfieFile, { upsert: true });
      if (selfieErr) throw selfieErr;

      // Save verification entry (status pending)
      const { error: insertErr } = await supabase.from('verifications').insert({
        user_id: user.id,
        id_image: idPath,
        selfie_image: selfiePath,
        status: 'pending'
      });
      if (insertErr) throw insertErr;

      // Do NOT auto-approve here. Admins should review pending verifications and approve/reject.
      toast.success('Verification submitted — pending admin review');
      navigate('/tasks');
    } catch (err: any) {
      console.error('Verification error:', err);
      toast.error(err.message || 'Error uploading verification');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Verify Your Identity</CardTitle>
            <CardDescription>Upload an image of your ID and a selfie to receive a verified badge.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Upload ID Image</label>
                <Input type="file" accept="image/*" onChange={onIdChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Upload Selfie</label>
                <Input type="file" accept="image/*" onChange={onSelfieChange} />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={uploading}>{uploading ? 'Uploading...' : 'Submit for Verification'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
