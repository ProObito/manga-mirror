import { Palette, Check, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useTheme, darkThemes, lightThemes, ThemeName } from '@/hooks/useTheme';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const ThemeSelector = () => {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          Choose Theme
          <span className="text-xs text-muted-foreground font-normal">
            {isDark ? <Moon className="h-3 w-3 inline mr-1" /> : <Sun className="h-3 w-3 inline mr-1" />}
            {darkThemes.find(t => t.id === theme)?.name || lightThemes.find(t => t.id === theme)?.name}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <Tabs defaultValue={isDark ? "dark" : "light"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="dark" className="text-xs gap-1">
              <Moon className="h-3 w-3" />
              Dark
            </TabsTrigger>
            <TabsTrigger value="light" className="text-xs gap-1">
              <Sun className="h-3 w-3" />
              Light
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dark" className="mt-0">
            <div className="grid grid-cols-4 gap-1.5 p-2">
              {darkThemes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`relative w-full aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                    theme === t.id 
                      ? 'border-primary ring-2 ring-primary/30' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  style={{ backgroundColor: t.color }}
                  title={t.name}
                >
                  {theme === t.id && (
                    <Check className="absolute inset-0 m-auto h-3 w-3 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="light" className="mt-0">
            <div className="grid grid-cols-4 gap-1.5 p-2">
              {lightThemes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`relative w-full aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                    theme === t.id 
                      ? 'border-primary ring-2 ring-primary/30' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  style={{ backgroundColor: t.color }}
                  title={t.name}
                >
                  {theme === t.id && (
                    <Check className="absolute inset-0 m-auto h-3 w-3 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSelector;
