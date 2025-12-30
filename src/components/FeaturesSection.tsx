import { motion } from 'framer-motion';
import { Shield, Zap, BookOpen, Users, Sparkles, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: BookOpen,
    title: 'Vast Library',
    description: 'Access thousands of manga and webtoon titles from multiple sources',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized reading experience with instant page loading',
  },
  {
    icon: Shield,
    title: 'Ad-Free Reading',
    description: 'Enjoy uninterrupted reading without annoying advertisements',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Join discussions, rate titles, and share your reading lists',
  },
  {
    icon: Sparkles,
    title: 'Personalized',
    description: 'Smart recommendations based on your reading preferences',
  },
  {
    icon: Globe,
    title: 'Multi-Source',
    description: 'Content aggregated from trusted sources worldwide',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl md:text-5xl tracking-wide text-foreground mb-4">
            Why Choose <span className="text-gradient">MangaHub</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Experience the best manga reading platform with features designed for passionate readers
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="elevated" className="p-6 h-full card-hover">
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
