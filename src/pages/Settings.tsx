import { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Camera, Crown, Link as LinkIcon, Save, Shield, Palette, Download, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ThemeSelector from '@/components/ThemeSelector';

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile, uploadAvatar, uploadCustomLogo, refetch } = useUserProfile();
  const [displayName, setDisplayName] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Initialize form values when profile loads
  useState(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
    }
  });

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const { error } = await uploadAvatar(file);
    if (error) {
      toast.error('Failed to upload avatar');
    } else {
      toast.success('Avatar updated successfully');
      refetch();
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!profile?.isPremium) {
      toast.error('Premium membership required for custom logos');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    const { error } = await uploadCustomLogo(file);
    if (error) {
      toast.error('Failed to upload logo');
    } else {
      toast.success('Custom logo updated successfully');
      refetch();
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await updateProfile({ displayName });
    setSaving(false);

    if (error) {
      toast.error('Failed to save profile');
    } else {
      toast.success('Profile saved successfully');
    }
  };

  const handleSaveBackendUrl = () => {
    if (backendUrl) {
      localStorage.setItem('backend_url', backendUrl);
      toast.success('Backend URL saved');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile
                </CardTitle>
                <CardDescription>Update your profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-primary/20">
                      <AvatarImage src={profile?.avatarUrl || undefined} />
                      <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                        {profile?.displayName?.[0] || user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{profile?.displayName || 'Reader'}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {profile?.isPremium && (
                      <Badge className="mt-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium Member
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName || profile?.displayName || ''}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>

                <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>

            {/* Premium Custom Logo */}
            <Card className={!profile?.isPremium ? 'opacity-75' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Premium Badge
                  {!profile?.isPremium && (
                    <Badge variant="outline" className="ml-2">Premium Only</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Add a custom logo next to your name (Premium feature)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {profile?.customLogoUrl ? (
                    <img 
                      src={profile.customLogoUrl} 
                      alt="Custom Logo" 
                      className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <Crown className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload a custom logo (max 2MB, recommended 128x128px)
                    </p>
                    <Button
                      variant="outline"
                      disabled={!profile?.isPremium}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </div>
                </div>
                {!profile?.isPremium && (
                  <Button variant="hero" className="w-full gap-2">
                    <Crown className="h-4 w-4" />
                    Upgrade to Premium
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Download Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Download Statistics
                </CardTitle>
                <CardDescription>Your monthly download usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-semibold">
                      {profile?.isPremium ? 'Unlimited' : `${profile?.downloadCount || 0} / 20`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.isPremium 
                        ? 'Premium members have unlimited downloads'
                        : 'Chapters downloaded this month'
                      }
                    </p>
                  </div>
                  {!profile?.isPremium && (
                    <Badge variant="secondary">Free Tier</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                  </div>
                  <ThemeSelector />
                </div>
              </CardContent>
            </Card>

            {/* Backend Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Backend Configuration
                </CardTitle>
                <CardDescription>Configure your backend connection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backendUrl">Backend URL</Label>
                  <Input
                    id="backendUrl"
                    value={backendUrl || localStorage.getItem('backend_url') || ''}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="https://your-backend.herokuapp.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your custom backend URL for manga data
                  </p>
                </div>
                <Button variant="outline" onClick={handleSaveBackendUrl} className="gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Save Backend URL
                </Button>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security
                </CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-muted-foreground">Change your password</p>
                    </div>
                    <Button variant="outline">Change Password</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
