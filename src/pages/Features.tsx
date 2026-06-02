import React from "react";
import { Navbar } from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Search,
  PlusCircle,
  ClipboardList,
  MessageCircle,
  UserCheck,
  Shield,
  Clock,
  Star,
  MapPin,
  Users,
  Heart
} from "lucide-react";

type Feature = {
  id: string;
  title: string;
  description: string;
  path: string;
  buttonText: string;
  icon: React.ElementType;
  gradient: string;
};

const FEATURES: Feature[] = [
  {
    id: "discover",
    title: "Discover Tasks Nearby",
    description: "Browse local tasks posted by neighbors and find meaningful ways to help your community. Filter by category, location, and budget.",
    path: "/tasks",
    buttonText: "Browse Tasks",
    icon: Search,
    gradient: "from-primary to-primary/60"
  },
  {
    id: "post",
    title: "Post a Task",
    description: "Create a task listing to request help from your community. Set your budget, describe your needs, and connect with helpers.",
    path: "/post-task",
    buttonText: "Post a Task",
    icon: PlusCircle,
    gradient: "from-accent to-accent/60"
  },
  {
    id: "mytasks",
    title: "My Tasks",
    description: "View and manage tasks you have posted or volunteered for. Track progress and communicate with participants.",
    path: "/my-tasks",
    buttonText: "View My Tasks",
    icon: ClipboardList,
    gradient: "from-secondary to-secondary/60"
  },
  {
    id: "messages",
    title: "In-app Messaging",
    description: "Chat securely with task posters and helpers to coordinate details, ask questions, and build trust.",
    path: "/conversations",
    buttonText: "Go to Messages",
    icon: MessageCircle,
    gradient: "from-primary to-accent"
  },
  {
    id: "profile",
    title: "Profile & Verification",
    description: "Manage your profile, submit verification documents, and showcase your community contributions and ratings.",
    path: "/profile",
    buttonText: "View Profile",
    icon: UserCheck,
    gradient: "from-accent to-secondary"
  },
];

const HIGHLIGHTS = [
  {
    icon: Shield,
    title: "Secure & Trusted",
    description: "Verified profiles and secure messaging keep you safe"
  },
  {
    icon: MapPin,
    title: "Hyperlocal",
    description: "Connect with neighbors in your immediate area"
  },
  {
    icon: Clock,
    title: "Track Hours",
    description: "Log and verify your volunteer service hours"
  },
  {
    icon: Star,
    title: "Build Reputation",
    description: "Earn ratings and reviews from the community"
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Built by neighbors, for neighbors"
  },
  {
    icon: Heart,
    title: "Make an Impact",
    description: "Every task completed strengthens our community"
  }
];

export default function Features() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent">
      <SEO
        title="Features — How Taskfy Works"
        description="See how Taskfy connects neighbors: post tasks, get offers, verified helpers, off-app payments, and trust & safety tools."
        path="/features"
      />
      <Navbar />
      <main className="container mx-auto px-4 pt-[calc(env(safe-area-inset-top)+5rem)] pb-12">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Heart className="w-4 h-4" />
              Connecting Communities
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Everything You Need to{" "}
              <span className="text-primary">Help & Be Helped</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Taskfy makes it easy to find help, offer assistance, and build stronger community connections.
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <Card
                key={feature.id}
                className="group glass-card border-border/50 overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 space-y-4">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} text-primary-foreground shadow-lg`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-between group/btn hover:bg-primary/10"
                    onClick={() => navigate(feature.path)}
                  >
                    {feature.buttonText}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Highlights Section */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Why Choose Taskfy?</h2>
              <p className="text-muted-foreground">Built with community values at its core</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {HIGHLIGHTS.map((highlight, index) => (
                <div
                  key={index}
                  className="text-center p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
                    <highlight.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-medium text-sm mb-1">{highlight.title}</h4>
                  <p className="text-xs text-muted-foreground">{highlight.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <Card className="glass-card border-border/50 overflow-hidden">
            <div className="relative p-8 md:p-12 text-center bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
              <div className="relative space-y-6">
                <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Join thousands of neighbors already helping each other. Post your first task or browse available opportunities.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" onClick={() => navigate('/post-task')} className="gap-2">
                    <PlusCircle className="w-5 h-5" />
                    Post a Task
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/tasks')} className="gap-2">
                    <Search className="w-5 h-5" />
                    Browse Tasks
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
