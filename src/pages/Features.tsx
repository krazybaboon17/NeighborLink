import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

type Feature = {
  id: string;
  title: string;
  description: string;
  hours: number;
};

const FEATURES: Feature[] = [
  {
    id: "discover",
    title: "Discover Tasks Nearby",
    description: "Browse local tasks posted by neighbors and find ways to help.",
    hours: 0,
  },
  {
    id: "post",
    title: "Post a Task",
    description: "Create a task listing to request help from your community.",
    hours: 0,
  },
  {
    id: "message",
    title: "In-app Messaging",
    description: "Chat with task posters and helpers to coordinate details.",
    hours: 0,
  },
  {
    id: "chat",
    title: "Real-time Chat",
    description: "Start conversations with helpers and coordinate details inside the app.",
    hours: 0,
  },
  {
    id: "volunteer",
    title: "Volunteer For Service Hours",
    description: "Sign up to complete a task for free and earn verified service hours.",
    hours: 2,
  },
  {
    id: "verify",
    title: "Verified Badge",
    description: "Submit ID and a selfie to get a verified badge and increase your visibility in recommendations.",
    hours: 0,
  },
  {
    id: "reviews",
    title: "Reviews & Ratings",
    description: "Rate helpers and task posters to build trust in the community.",
    hours: 0,
  },
  {
    id: "recommendations",
    title: "Smart Recommendations",
    description: "Verified and high-performing helpers get recommended for new tasks.",
    hours: 0,
  },
];

export default function Features() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [volunteered, setVolunteered] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    const key = `volunteers_${user.id}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setVolunteered(parsed || {});
      } catch (e) {
        // ignore
      }
    }
  }, [user]);

  const handleVolunteer = (feature: Feature) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to volunteer and track service hours." });
      navigate('/auth');
      return;
    }

    const key = `volunteers_${user.id}`;
    const current = { ...(volunteered || {}) };
    const prev = current[feature.id] || 0;
    current[feature.id] = prev + feature.hours;
    localStorage.setItem(key, JSON.stringify(current));
    setVolunteered(current);

    toast({ title: "Thank you!", description: `You volunteered ${feature.hours} hour(s) for ${feature.title}.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>Learn what NeighborLink can do — and volunteer to earn service hours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {FEATURES.map((f) => (
              <div key={f.id} className="flex items-start justify-between border rounded-md p-4 bg-card">
                <div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                  {volunteered[f.id] ? (
                    <p className="mt-2 text-xs text-success">You have recorded {volunteered[f.id]} service hour(s) for this feature.</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className="text-sm text-muted-foreground">{f.hours} hr{f.hours !== 1 ? 's' : ''}</span>
                  <Button variant="outline" onClick={() => handleVolunteer(f)}>
                    Volunteer
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
