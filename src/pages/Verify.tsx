import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FaceVerification } from '@/components/FaceVerification';
import { Camera, Upload, CheckCircle } from 'lucide-react';

export default function Verify() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [faceVerificationResult, setFaceVerificationResult] = useState<{
    success: boolean;
    estimatedAge?: number;
    isAdult?: boolean;
    confidence?: string;
  } | null>(null);

  const onIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdFile(e.target.files?.[0] || null);
  };
  const onSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelfieFile(e.target.files?.[0] || null);
  };

  const handleFaceVerificationComplete = async (result: {
    success: boolean;
    estimatedAge?: number;
    isAdult?: boolean;
    confidence?: string;
  }) => {
    setFaceVerificationResult(result);
    setShowFaceVerification(false);

    if (result.success && user) {
      try {
        // Update the user's profile with the verified age
        const isYoungNeighbor = !result.isAdult;
        
        const { error } = await supabase
          .from('profiles')
          .update({
            age: result.estimatedAge,
            is_young_neighbor: isYoungNeighbor,
            verified: true,
          })
          .eq('id', user.id);

        if (error) throw error;

        toast.success(
          result.isAdult 
            ? 'Age verified successfully! You are confirmed as 18+.' 
            : `Age verified! You are a Young Neighbor (estimated age: ${result.estimatedAge}).`
        );
        
        // Navigate to tasks after successful verification
        setTimeout(() => navigate('/tasks'), 2000);
      } catch (err: any) {
        console.error('Error updating profile:', err);
        toast.error('Verification complete but failed to update profile. Please try again.');
      }
    }
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

      toast.success('Verification submitted — pending admin review');
      navigate('/tasks');
    } catch (err: any) {
      console.error('Verification error:', err);
      toast.error(err.message || 'Error uploading verification');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Please <Button variant="link" onClick={() => navigate('/auth')} className="p-0">sign in</Button> to verify your identity.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (showFaceVerification) {
    return (
      <div className="min-h-screen bg-transparent">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <FaceVerification
            onVerificationComplete={handleFaceVerificationComplete}
            onCancel={() => setShowFaceVerification(false)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Verify Your Identity</CardTitle>
            <CardDescription>Choose a verification method to confirm your age and identity.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="face" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="face" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Face Scan
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Documents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="face" className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Quick AI Age Verification</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Use your camera for instant age verification. Our AI will estimate your age
                      without storing any images.
                    </p>
                  </div>

                  {faceVerificationResult?.success && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <CheckCircle className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="text-foreground font-medium">
                        Verified! Estimated age: {faceVerificationResult.estimatedAge}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {faceVerificationResult.isAdult ? 'Adult (18+)' : 'Young Neighbor'}
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={() => setShowFaceVerification(true)}
                    size="lg"
                    className="w-full"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Start Face Verification
                  </Button>

                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5 justify-center">
                    <Lock className="w-3 h-3" aria-hidden="true" />
                    Privacy: Your image is processed instantly and never stored.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="documents">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground">
                      Upload ID documents for manual verification by our team.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Upload ID Image</label>
                    <Input type="file" accept="image/*" onChange={onIdChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Upload Selfie</label>
                    <Input type="file" accept="image/*" onChange={onSelfieChange} />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Submit for Review'}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    Documents will be reviewed by our team within 24-48 hours.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
