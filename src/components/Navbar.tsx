import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, LogOut, Plus, Check, Clock, Shield, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [hasVolunteerHours, setHasVolunteerHours] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
      checkVolunteerHours();
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('check_is_admin');
      if (error) throw error;
      setIsAdmin(data === true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkVolunteerHours = async () => {
    try {
      const { count, error } = await supabase
        .from('volunteer_hours')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);
      if (!error && count && count > 0) setHasVolunteerHours(true);
    } catch (error) {
      console.error('Error checking volunteer hours:', error);
    }
  };

  const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => {
    const isActive = location.pathname === href;
    const isExternal = href.startsWith('#');

    const className = cn(
      "text-sm font-medium transition-colors relative py-1",
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
      "block md:inline-block py-2 md:py-0"
    );

    if (isExternal) return <a href={href} className={className} onClick={onClick}>{children}</a>;

    return (
      <Link to={href} className={className} onClick={onClick}>
        {children}
        {isActive && (
          <motion.div
            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full hidden md:block"
            layoutId="nav-indicator"
          />
        )}
      </Link>
    );
  };

  return (
    <motion.nav
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "glass border-b border-border/50 shadow-sm" : "bg-transparent border-b border-transparent"
      )}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <motion.div
              className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              <span className="text-primary-foreground font-bold text-lg">N</span>
            </motion.div>
            <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">NeighborLink</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLink href="/tasks">Browse Tasks</NavLink>
            <NavLink href="/my-tasks">My Tasks</NavLink>
            {hasVolunteerHours && (
              <NavLink href="/service-hours">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Service Hours
                </span>
              </NavLink>
            )}
            <NavLink href="/features">Features</NavLink>
            {isAdmin && (
              <NavLink href="/admin/verifications">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </span>
              </NavLink>
            )}
            <NavLink href="/conversations">Messages</NavLink>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <Button variant="default" size="sm" onClick={() => navigate('/post-task')} className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  Post Task
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={profile?.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {profile?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {profile?.verified && (
                          <span className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-0.5 border-2 border-background">
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </span>
                        )}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{profile?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" /> My Profile
                    </DropdownMenuItem>
                    {hasVolunteerHours && (
                      <DropdownMenuItem onClick={() => navigate('/service-hours')}>
                        <Clock className="mr-2 h-4 w-4" /> Service Hours
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Sign In</Button>
                <Button variant="default" size="sm" onClick={() => navigate('/auth')}>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            whileTap={{ scale: 0.9 }}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="md:hidden py-4 space-y-1 border-t border-border"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <NavLink href="/tasks" onClick={() => setIsOpen(false)}>Browse Tasks</NavLink>
              <NavLink href="/my-tasks" onClick={() => setIsOpen(false)}>My Tasks</NavLink>
              {hasVolunteerHours && (
                <NavLink href="/service-hours" onClick={() => setIsOpen(false)}>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Service Hours</span>
                </NavLink>
              )}
              <NavLink href="/features" onClick={() => setIsOpen(false)}>Features</NavLink>
              <NavLink href="/conversations" onClick={() => setIsOpen(false)}>Messages</NavLink>
              {isAdmin && (
                <NavLink href="/admin/verifications" onClick={() => setIsOpen(false)}>
                  <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> Admin</span>
                </NavLink>
              )}

              <div className="pt-4 space-y-2 border-t border-border mt-2">
                {user ? (
                  <>
                    <div className="flex items-center space-x-3 px-2 py-2 mb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {profile?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{profile?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button className="w-full gap-1.5" onClick={() => { navigate('/post-task'); setIsOpen(false); }}>
                      <Plus className="w-4 h-4" /> Post Task
                    </Button>
                    <Button variant="ghost" className="w-full text-destructive" onClick={() => { signOut(); setIsOpen(false); }}>
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full" onClick={() => { navigate('/auth'); setIsOpen(false); }}>Sign In</Button>
                    <Button className="w-full" onClick={() => { navigate('/auth'); setIsOpen(false); }}>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Get Started
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};
