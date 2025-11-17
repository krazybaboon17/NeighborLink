import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Search, PlusCircle, MessageSquare, ShieldCheck, Clock, Star } from "lucide-react";

type Feature = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
};

const FEATURES: Feature[] = [
  {
    id: "browse",
    title: "Browse Tasks",
    description: "Discover local tasks posted by neighbors and find ways to help your community.",
    icon: <Search className="w-8 h-8" />,
    link: "/tasks",
  },
  {
    id: "post",
    title: "Post a Task",
    description: "Create a task listing to request help from trusted neighbors in your area.",
    icon: <PlusCircle className="w-8 h-8" />,
    link: "/post-task",
  },
  {
    id: "messages",
    title: "Real-time Messaging",
    description: "Chat with task posters and helpers to coordinate details seamlessly.",
    icon: <MessageSquare className="w-8 h-8" />,
    link: "/conversations",
  },
  {
    id: "my-tasks",
    title: "Manage Tasks",
    description: "View and manage all your posted tasks and applications in one place.",
    icon: <Clock className="w-8 h-8" />,
    link: "/my-tasks",
  },
  {
    id: "verify",
    title: "Get Verified",
    description: "Submit ID and verification to earn a trusted badge and increase visibility.",
    icon: <ShieldCheck className="w-8 h-8" />,
    link: "/profile",
  },
  {
    id: "profile",
    title: "Your Profile",
    description: "Build your reputation with reviews, ratings, and completed tasks.",
    icon: <Star className="w-8 h-8" />,
    link: "/profile",
  },
];

export default function Features() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-semibold tracking-tight">Features</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to connect with your community and get things done.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 pt-8">
            {FEATURES.map((feature) => (
              <Card
                key={feature.id}
                className="p-8 cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] border-border/50"
                onClick={() => navigate(feature.link)}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    {feature.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
