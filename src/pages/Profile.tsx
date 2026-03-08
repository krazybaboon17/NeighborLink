import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Star, Sparkles, Wand2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { YoungNeighborBadge } from '@/components/YoungNeighborBadge';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { motion } from 'framer-motion';

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name').max(100, 'Name is too long (max 100 characters)')
});

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [isYoungNeighbor, setIsYoungNeighbor] = useState<boolean>(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [paypalId, setPaypalId] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('full_name, avatar_url, rating, completed_tasks, is_young_neighbor, bio, skills').eq('id', user!.id).single();
      if (error) throw error;
      setFullName(data?.full_name || '');
      setAvatarUrl(data?.avatar_url || null);
      setRating(data?.rating || null);
      setCompletedTasks(data?.completed_tasks || 0);
      setIsYoungNeighbor(data?.is_young_neighbor || false);
      setBio(data?.bio || '');
      setSkills(data?.skills || []);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      if (f.size > MAX_FILE_SIZE) { toast.error('File size must be less than 5MB'); return; }
      if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) { toast.error('Only JPEG, PNG, and WebP images are allowed'); return; }
    }
    setAvatarFile(f);
  };

  const handleAIBio = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: {
          type: 'generate-bio',
          data: { fullName, skills, completedTasks, rating, isYoungNeighbor }
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.result) {
        setBio(data.result);
        toast.success('AI bio generated!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate bio');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validation = profileSchema.safeParse({ fullName });
    if (!validation.success) { toast.error(validation.error.errors[0].message); return; }

    setSubmitting(true);
    try {
      let publicUrl = avatarUrl;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
        if (uploadErr) { toast.error('Failed to upload avatar'); setSubmitting(false); return; }
        const { data: urlData } = await supabase.storage.from('avatars').getPublicUrl(filePath);
        publicUrl = urlData?.publicUrl || null;
      }

      const { error } = await supabase.from('profiles').update({
        full_name: validation.data.fullName,
        avatar_url: publicUrl,
        bio
      }).eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated');
      setAvatarFile(null);
      setAvatarUrl(publicUrl);
    } catch (err: any) {
      toast.error(err.message || 'Error updating profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-transparent py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-card border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Edit Profile</CardTitle>
                    <CardDescription>Update your display name, bio, and avatar</CardDescription>
                  </div>
                  {avatarUrl && (
                    <motion.img
                      src={avatarUrl}
                      alt="avatar"
                      className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
                      whileHover={{ scale: 1.1 }}
                    />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {isYoungNeighbor && <YoungNeighborBadge />}
                  {completedTasks > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-lg font-semibold">{rating !== null ? rating.toFixed(1) : '0.0'}</span>
                      </div>
                      <div className="h-4 w-px bg-border" />
                      <span className="text-muted-foreground">{completedTasks} task{completedTasks !== 1 ? 's' : ''} completed</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bio">Bio</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1 text-primary hover:text-primary/80"
                        onClick={handleAIBio}
                        disabled={aiLoading}
                      >
                        {aiLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3" />
                        )}
                        AI Generate
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1">
                          <Sparkles className="w-2 h-2" />
                        </Badge>
                      </Button>
                    </div>
                    <Textarea
                      id="bio"
                      placeholder="Tell neighbors about yourself..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar</Label>
                    <input id="avatar" type="file" accept="image/*" onChange={handleFileChange} className="text-sm" />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save Profile
                    </Button>
                    <Button variant="outline" type="button" onClick={() => navigate('/tasks')}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
