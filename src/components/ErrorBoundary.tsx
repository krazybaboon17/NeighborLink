import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary. If anything throws during render, show a friendly
 * recovery screen instead of a blank white page. Logs to console for devs
 * but never exposes the stack trace to users.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center bg-background p-6"
      >
        <div
          className="max-w-md w-full bg-card rounded-3xl p-8 text-center"
          style={{ boxShadow: "0 20px 60px hsl(60 3% 17% / 0.1)" }}
        >
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Something went wrong
          </h1>
          <p className="font-body text-sm text-muted-foreground mb-6">
            We hit an unexpected error. You can try again or head back home — your
            data is safe.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              onClick={this.handleReset}
              variant="outline"
              className="rounded-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
              Try again
            </Button>
            <Button onClick={this.handleHome} className="rounded-full">
              <Home className="w-4 h-4 mr-2" aria-hidden="true" />
              Go home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
