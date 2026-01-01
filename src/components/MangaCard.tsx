import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, BookOpen, Edit } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Manga } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

interface MangaCardProps {
  manga: Manga;
  index?: number;
  variant?: 'default' | 'compact' | 'featured';
}

const MangaCard = ({ manga, index = 0, variant = 'default' }: MangaCardProps) => {
  const { isAdmin, isOwner } = useAuth();
  const navigate = useNavigate();
  const canEdit = isAdmin || isOwner;

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/admin/manga/edit/${manga.id}`);
  };

  if (variant === 'compact') {
    return (
      <Link to={`/manga/${manga.id}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex gap-4 p-3 rounded-xl hover:bg-muted transition-colors group relative"
        >
          <img
            src={manga.cover}
            alt={manga.title}
            className="w-16 h-24 object-cover rounded-lg"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {manga.title}
            </h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Star className="h-3 w-3 text-primary fill-primary" />
              <span>{manga.rating}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {manga.chapters.length} chapters
            </p>
          </div>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </motion.div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link to={`/manga/${manga.id}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card variant="elevated" className="overflow-hidden card-hover group relative">
            <div className="relative aspect-[3/4]">
              <img
                src={manga.cover}
                alt={manga.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
              
              {/* Edit Button */}
              {canEdit && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={handleEdit}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              
              {/* Ranking Badge */}
              {index < 3 && (
                <div className="absolute top-3 left-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-lg ${
                    index === 0 ? 'bg-gradient-primary text-primary-foreground' :
                    index === 1 ? 'bg-muted text-foreground' :
                    'bg-primary/20 text-primary'
                  }`}>
                    {index + 1}
                  </div>
                </div>
              )}
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Badge variant="status" className="mb-2">{manga.status}</Badge>
                <h3 className="font-display text-2xl text-foreground mb-2 line-clamp-2">
                  {manga.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-primary fill-primary" />
                    {manga.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {manga.chapters.length}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to={`/manga/${manga.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card variant="default" className="overflow-hidden card-hover group relative">
          <div className="relative aspect-[2/3]">
            <img
              src={manga.cover}
              alt={manga.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
            
            {/* Edit Button */}
            {canEdit && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            
            {/* Status Badge */}
            <div className="absolute top-2 right-2">
              <Badge variant="status" className="text-xs">
                {manga.status}
              </Badge>
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {manga.title}
            </h3>
            
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-primary fill-primary" />
                {manga.rating}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {manga.chapters.length}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-3">
              {manga.genres.slice(0, 2).map((genre) => (
                <Badge key={genre} variant="ghost" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
};

export default MangaCard;