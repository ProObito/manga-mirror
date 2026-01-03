import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useTheme, themes, ThemeName } from '@/hooks/useTheme';

export const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="grid grid-cols-3 gap-1 p-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`relative w-full aspect-square rounded-lg border-2 transition-all ${
                theme === t.id 
                  ? 'border-primary ring-2 ring-primary/30' 
                  : 'border-border hover:border-primary/50'
              }`}
              style={{ backgroundColor: t.color }}
              title={t.name}
            >
              {theme === t.id && (
                <Check className="absolute inset-0 m-auto h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <div className="px-2 py-1">
          <p className="text-xs text-muted-foreground text-center">
            {themes.find(t => t.id === theme)?.name}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSelector;