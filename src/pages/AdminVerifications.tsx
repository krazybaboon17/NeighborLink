import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type VerificationRow = {
  id: string;
  user_id: string;
  id_image: string | null;
  selfie_image: string | null;
  status: string;
  created_at: string | null;
  profiles?: {
    full_name?: string | null;
    avatar_url?: string | null;
  };
};

export default function AdminVerifications() {
  const [items, setItems] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select(`*, profiles ( full_name, avatar_url )`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data as VerificationRow[]) || []);
    } catch (err) {
      console.error('Error fetching verifications:', err);
      toast.error('Error fetching verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, userId: string) => {
    try {
      const { error: updErr } = await supabase.from('verifications').update({ status: 'approved' }).eq('id', id);
      if (updErr) throw updErr;

      const { error: profErr } = await supabase.from('profiles').update({ verified: true }).eq('id', userId);
      if (profErr) throw profErr;

      toast.success('Verification approved');
      fetchPending();
    } catch (err) {
      console.error('Approve error:', err);
      toast.error('Error approving verification');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase.from('verifications').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
      toast.success('Verification rejected');
      fetchPending();
    } catch (err) {
      console.error('Reject error:', err);
      toast.error('Error rejecting verification');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">Pending Verifications</h1>
        {loading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p>No pending verifications</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((v) => (
              <Card key={v.id}>
                <CardHeader>
                  <CardTitle>{v.profiles?.full_name || v.user_id}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">ID Image</p>
                      {v.id_image ? (
                        <img
                          src={supabase.storage.from('verifications').getPublicUrl(v.id_image).data.publicUrl}
                          alt="id"
                          className="w-full max-h-64 object-contain rounded"
                        />
                      ) : (
                        <p className="text-sm">No ID image</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Selfie</p>
                      {v.selfie_image ? (
                        <img
                          src={supabase.storage.from('verifications').getPublicUrl(v.selfie_image).data.publicUrl}
                          alt="selfie"
                          className="w-full max-h-64 object-contain rounded"
                        />
                      ) : (
                        <p className="text-sm">No selfie</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => handleApprove(v.id, v.user_id)}>Approve</Button>
                      <Button variant="destructive" onClick={() => handleReject(v.id)}>Reject</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
