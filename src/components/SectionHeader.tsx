import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  viewAllLink?: string;
}

const SectionHeader = ({ title, subtitle, icon, viewAllLink }: SectionHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex items-end justify-between mb-8"
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h2 className="font-display text-3xl md:text-4xl tracking-wide text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      
      {viewAllLink && (
        <Link to={viewAllLink}>
          <Button variant="ghost" className="group">
            View All
            <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      )}
    </motion.div>
  );
};

export default SectionHeader;
