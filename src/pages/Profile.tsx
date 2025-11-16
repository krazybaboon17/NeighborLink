import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user!.id).single();
      if (error) throw error;
      setFullName(data?.full_name || '');
      setAvatarUrl(data?.avatar_url || null);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setAvatarFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      let publicUrl = avatarUrl;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${user.id}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
        if (uploadErr) {
          console.error('Upload error:', uploadErr);
          toast.error('Failed to upload avatar');
          setSubmitting(false);
          return;
        }

        const { data: urlData } = await supabase.storage.from('avatars').getPublicUrl(filePath);
        publicUrl = urlData?.publicUrl || null;
      }

      const { error } = await supabase.from('profiles').update({ full_name: fullName, avatar_url: publicUrl }).eq('id', user.id);
      if (error) throw error;

      toast.success('Profile updated');
      setAvatarFile(null);
      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast.error(err.message || 'Error updating profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (<><Navbar /><div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div></>);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your display name and avatar. Tasks you post will show your name.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar</Label>
                  <input id="avatar" type="file" accept="image/*" onChange={handleFileChange} />
                  {avatarUrl && <img src={avatarUrl} alt="avatar" className="h-24 w-24 rounded-md mt-2 object-cover" />}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save</Button>
                  <Button variant="outline" onClick={() => navigate('/tasks')}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
