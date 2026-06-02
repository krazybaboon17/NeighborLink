import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldX } from 'lucide-react';

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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check admin status on mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('check_is_admin');
        if (error) throw error;
        setIsAdmin(data === true);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Fetch verifications only if admin
  useEffect(() => {
    if (isAdmin === true) {
      fetchPending();
    } else if (isAdmin === false) {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select(`*`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rawRows = data || [];

      // Admins can read profiles directly via admin RLS policy
      const userIds = [...new Set(rawRows.map((r: any) => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

      const rows: VerificationRow[] = rawRows.map((r: any) => ({
        ...r,
        profiles: profileMap.get(r.user_id) || { full_name: null, avatar_url: null }
      }));
      setItems(rows);

      // Generate signed URLs for all images
      const urls: Record<string, string> = {};
      for (const v of rows) {
        for (const key of ['id_image', 'selfie_image'] as const) {
          const path = v[key];
          if (path) {
            const { data: signedData } = await supabase.storage
              .from('verifications')
              .createSignedUrl(path, 3600);
            if (signedData?.signedUrl) {
              urls[path] = signedData.signedUrl;
            }
          }
        }
      }
      setSignedUrls(urls);
    } catch (err) {
      console.error('Error fetching verifications:', err);
      toast.error('Error fetching verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, userId: string) => {
    try {
      const { error } = await supabase.rpc('admin_approve_verification', {
        verification_id: id,
        target_user_id: userId
      });
      if (error) throw error;

      toast.success('Verification approved');
      fetchPending();
    } catch (err) {
      console.error('Approve error:', err);
      toast.error('Error approving verification');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase.rpc('admin_reject_verification', {
        verification_id: id
      });
      if (error) throw error;
      toast.success('Verification rejected');
      fetchPending();
    } catch (err) {
      console.error('Reject error:', err);
      toast.error('Error rejecting verification');
    }
  };

  // Show loading while checking admin status
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-transparent">
        <Navbar />
        <main className="container mx-auto px-4 pt-[calc(env(safe-area-inset-top)+5rem)] pb-12">
          <p>Checking authorization...</p>
        </main>
      </div>
    );
  }

  // Show unauthorized message if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-transparent">
        <Navbar />
        <main className="container mx-auto px-4 pt-[calc(env(safe-area-inset-top)+5rem)] pb-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <ShieldX className="w-16 h-16 text-destructive" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">You do not have permission to access this page.</p>
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <main className="container mx-auto px-4 pt-[calc(env(safe-area-inset-top)+5rem)] pb-12">
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
                      {v.id_image && signedUrls[v.id_image] ? (
                        <img
                          src={signedUrls[v.id_image]}
                          alt="id"
                          className="w-full max-h-64 object-contain rounded"
                        />
                      ) : (
                        <p className="text-sm">No ID image</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Selfie</p>
                      {v.selfie_image && signedUrls[v.selfie_image] ? (
                        <img
                          src={signedUrls[v.selfie_image]}
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