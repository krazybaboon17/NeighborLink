import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Calendar, Award, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { SEO } from "@/components/SEO";

type VolunteerHourEntry = {
  id: string;
  hours: number;
  created_at: string;
  task_id: string;
  task_title?: string;
};

export default function ServiceHours() {
  const { user } = useAuth();
  const [hours, setHours] = useState<VolunteerHourEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    if (user) {
      fetchVolunteerHours();
    }
  }, [user]);

  const fetchVolunteerHours = async () => {
    try {
      const { data, error } = await supabase
        .from('volunteer_hours')
        .select(`
          id,
          hours,
          created_at,
          task_id,
          tasks (title)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map((entry: any) => ({
        id: entry.id,
        hours: entry.hours,
        created_at: entry.created_at,
        task_id: entry.task_id,
        task_title: entry.tasks?.title || 'Unknown Task'
      }));

      setHours(formattedData);
      setTotalHours(formattedData.reduce((sum, entry) => sum + entry.hours, 0));
    } catch (error) {
      console.error('Error fetching volunteer hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: "Total Hours",
      value: totalHours,
      icon: Clock,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      label: "Tasks Completed",
      value: hours.length,
      icon: Award,
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      label: "This Month",
      value: hours.filter(h => {
        const date = new Date(h.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).reduce((sum, h) => sum + h.hours, 0),
      icon: Calendar,
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
    {
      label: "Avg per Task",
      value: hours.length > 0 ? (totalHours / hours.length).toFixed(1) : 0,
      icon: TrendingUp,
      color: "text-muted-foreground",
      bgColor: "bg-muted"
    }
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <SEO
        title="Your service hours — Taskify"
        description="Track volunteer service hours earned by helping neighbors on Taskify. Export verified hours for school, scouts, or community programs."
        path="/service-hours"
      />
      <Navbar />
      <main className="container mx-auto px-4 pt-[calc(env(safe-area-inset-top)+5rem)] pb-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Service Hours</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Track your volunteer contributions and see the impact you've made in your community.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="glass-card border-border/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${stat.bgColor} mb-3`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Hours Log */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Service Log
              </CardTitle>
              <CardDescription>
                A detailed record of all your volunteer hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="w-12 h-12 rounded-lg bg-muted"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : hours.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No volunteer hours recorded yet.</p>
                  <p className="text-sm">Complete tasks to start tracking your service hours!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hours.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary font-bold">
                        {entry.hours}h
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{entry.task_title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(entry.created_at), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Award className="w-4 h-4" />
                        <span>Verified</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
