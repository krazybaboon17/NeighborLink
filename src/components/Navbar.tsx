import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, LogOut, Plus, MoveLeft, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [hasClickedLogo, setHasClickedLogo] = useState(() => {
    return localStorage.getItem('hasClickedLogo') === 'true'
  });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // admin detection: either a profile flag or env list of admin emails (VITE_ADMIN_EMAILS)
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  const isAdmin = Boolean(profile?.is_admin) || (user && adminEmails.includes(user.email || ''));

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const isLandingPage = location.pathname === '/';

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="/"
                    className="flex items-center space-x-2 relative"
                    onClick={() => {
                      if (!hasClickedLogo) {
                        setHasClickedLogo(true);
                        localStorage.setItem('hasClickedLogo', 'true');
                      }
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-lg">N</span>
                    </div>
                    <span className="text-xl font-bold text-foreground">NeighborLink</span>
                    {!hasClickedLogo && (
                      <div className="absolute -right-10 top-1/2 -translate-y-1/2 flex items-center text-primary animate-pulse">
                        <MoveLeft className="w-5 h-5" />
                      </div>
                    )}
                  </a>
                </TooltipTrigger>
                <TooltipContent
                  className={cn(
                    "font-medium bg-primary text-primary-foreground border-primary",
                    "text-sm px-3 py-1.5 shadow-md"
                  )}
                >
                  Click to return home
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isLandingPage ? (
              <>
                <a href="#how-it-works" className="text-foreground hover:text-primary transition-colors">
                  How It Works
                </a>
                <a href="#categories" className="text-foreground hover:text-primary transition-colors">
                  Categories
                </a>
                <a href="#safety" className="text-foreground hover:text-primary transition-colors">
                  Safety
                </a>
                <a href="/features" className="text-foreground hover:text-primary transition-colors">
                  Features
                </a>
                {isAdmin && (
                  <a href="/admin/verifications" className="text-foreground hover:text-primary transition-colors">
                    Admin
                  </a>
                )}
                <a href="/conversations" className="text-foreground hover:text-primary transition-colors">
                  Chat
                </a>
              </>
            ) : (
              <>
                <a href="/tasks" className="text-foreground hover:text-primary transition-colors">
                  Browse Tasks
                </a>
                <a href="/my-tasks" className="text-foreground hover:text-primary transition-colors">
                  My Tasks
                </a>
                <a href="/features" className="text-foreground hover:text-primary transition-colors">
                  Features
                </a>
                {isAdmin && (
                  <a href="/admin/verifications" className="text-foreground hover:text-primary transition-colors">
                    Admin
                  </a>
                )}
                {user && (
                  <a href="/post-task" className="text-foreground hover:text-primary transition-colors">
                    Post Task
                  </a>
                )}
                <a href="/conversations" className="text-foreground hover:text-primary transition-colors">
                  Chat
                </a>
                {/* Verify tab removed temporarily */}
              </>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Button variant="outline" onClick={() => navigate('/post-task')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Post Task
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile?.avatar_url || ''} />
                          <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        {profile?.verified && (
                          <span className="absolute -bottom-1 -right-1 bg-green-600 rounded-full p-0.5 border border-white">
                            <Check className="w-3 h-3 text-white" />
                          </span>
                        )}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')}>Sign In</Button>
                <Button variant="hero" onClick={() => navigate('/auth')}>Get Started</Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-border">
            {isLandingPage ? (
              <>
                <a
                  href="#how-it-works"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  How It Works
                </a>
                <a
                  href="#categories"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Categories
                </a>
                <a
                  href="#safety"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Safety
                </a>
                <a
                  href="/features"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Features
                </a>
                {isAdmin && (
                  <a
                    href="/admin/verifications"
                    className="block py-2 text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin
                  </a>
                )}
              </>
            ) : (
              <>
                <a
                  href="/tasks"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Browse Tasks
                </a>
                <a
                  href="/my-tasks"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  My Tasks
                </a>
                <a
                  href="/features"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Features
                </a>
                {user && (
                  <a
                    href="/post-task"
                    className="block py-2 text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Post Task
                  </a>
                )}
              </>
            )}

            <div className="pt-4 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center space-x-3 px-2 py-2 border-b border-border mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => { navigate('/post-task'); setIsOpen(false); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Post Task
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => { signOut(); setIsOpen(false); }}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="w-full" onClick={() => { navigate('/auth'); setIsOpen(false); }}>
                    Sign In
                  </Button>
                  <Button variant="hero" className="w-full" onClick={() => { navigate('/auth'); setIsOpen(false); }}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};