import { Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display tracking-wide flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Configure site settings</p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic site configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input defaultValue="MangaHub" />
            </div>
            <div className="space-y-2">
              <Label>Site Description</Label>
              <Input defaultValue="Read manga and webtoons online for free" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Reading Settings</CardTitle>
            <CardDescription>Configure reader behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Default Reading Mode</Label>
                <p className="text-sm text-muted-foreground">Set the default reading direction</p>
              </div>
              <Button variant="outline" size="sm">
                Vertical
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Preload Images</Label>
                <p className="text-sm text-muted-foreground">Preload next chapter images</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Token System</CardTitle>
            <CardDescription>Configure the token/coin system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Chapter Cost</Label>
              <Input type="number" defaultValue={5} />
            </div>
            <div className="space-y-2">
              <Label>New User Bonus Tokens</Label>
              <Input type="number" defaultValue={0} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
