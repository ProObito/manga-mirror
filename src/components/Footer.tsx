import { Link } from 'react-router-dom';
import { BookOpen, Twitter, Github, MessageCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    browse: [
      { name: 'All Manga', href: '/browse' },
      { name: 'Trending', href: '/trending' },
      { name: 'Latest Updates', href: '/latest' },
      { name: 'Top Rated', href: '/top-rated' },
      { name: 'Genres', href: '/genres' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Careers', href: '/careers' },
      { name: 'Blog', href: '/blog' },
    ],
    support: [
      { name: 'FAQ', href: '/faq' },
      { name: 'Help Center', href: '/help' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy' },
    ],
  };

  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="font-display text-2xl tracking-wider text-foreground">
                MANGA<span className="text-primary">HUB</span>
              </span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Your ultimate destination for reading manga and webtoons. Discover thousands of titles, 
              track your progress, and join our community of readers.
            </p>
            
            {/* Newsletter */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Subscribe to our newsletter</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your email"
                  className="max-w-xs"
                />
                <Button variant="hero">Subscribe</Button>
              </div>
            </div>
          </div>

          {/* Browse Links */}
          <div>
            <h4 className="font-display text-lg mb-4 text-foreground">Browse</h4>
            <ul className="space-y-2">
              {footerLinks.browse.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-display text-lg mb-4 text-foreground">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-display text-lg mb-4 text-foreground">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} MangaHub. All rights reserved.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Twitter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Github className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
