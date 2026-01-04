import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Settings, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface AutoScrollControlsProps {
  enabled: boolean;
  speed: number;
  isPaused: boolean;
  pauseOnManualScroll: boolean;
  onToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onPauseOnManualScrollToggle: () => void;
  onResume: () => void;
}

export function AutoScrollControls({
  enabled,
  speed,
  isPaused,
  pauseOnManualScroll,
  onToggle,
  onSpeedChange,
  onPauseOnManualScrollToggle,
  onResume,
}: AutoScrollControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Main toggle button */}
      <Button
        variant={enabled ? 'default' : 'glass'}
        size="icon"
        onClick={onToggle}
        className="relative"
      >
        {enabled ? (
          isPaused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )
        ) : (
          <Play className="h-4 w-4" />
        )}
        {enabled && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
        )}
      </Button>

      {/* Paused indicator */}
      <AnimatePresence>
        {enabled && isPaused && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <Button variant="outline" size="sm" onClick={onResume}>
              Resume
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speed controls */}
      {enabled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 bg-background/50 backdrop-blur-sm rounded-lg px-3 py-1"
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onSpeedChange(speed - 1)}
            disabled={speed <= 1}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <span className="text-xs font-medium w-4 text-center">{speed}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onSpeedChange(speed + 1)}
            disabled={speed >= 10}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
        </motion.div>
      )}

      {/* Settings popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="glass" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Auto Scroll Speed</Label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">Slow</span>
                <Slider
                  value={[speed]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={([value]) => onSpeedChange(value)}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground">Fast</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Speed: {speed}/10
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="pause-manual" className="text-sm">
                Pause on manual scroll
              </Label>
              <Switch
                id="pause-manual"
                checked={pauseOnManualScroll}
                onCheckedChange={onPauseOnManualScrollToggle}
              />
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Click anywhere to toggle auto-scroll</p>
              <p>• Use speed slider for smooth reading</p>
              <p>• Manual scroll will pause temporarily</p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
