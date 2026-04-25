import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log only in dev — production users don't need to see this
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn("404:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div
        className="max-w-md w-full bg-card rounded-3xl p-10 text-center"
        style={{ boxShadow: "0 20px 60px hsl(60 3% 17% / 0.1)" }}
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Compass className="w-10 h-10 text-primary" aria-hidden="true" />
        </div>
        <h1 className="font-display text-6xl font-bold text-foreground mb-2">404</h1>
        <p className="font-display text-xl text-foreground mb-2">
          Wrong neighborhood
        </p>
        <p className="font-body text-sm text-muted-foreground mb-8">
          We couldn't find the page you're looking for. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/tasks">
              <Search className="w-4 h-4 mr-2" aria-hidden="true" />
              Browse tasks
            </Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" aria-hidden="true" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
