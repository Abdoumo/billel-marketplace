import { Layout } from "./layout/Layout";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  path: string;
}

export const PlaceholderPage = ({
  title,
  description,
  path,
}: PlaceholderPageProps) => {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="text-center space-y-8 max-w-md">
          <div className="flex items-center justify-center">
            <div className="h-20 w-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
              <Construction className="h-10 w-10 text-primary" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              This page is currently under development. Continue prompting to help us build it!
            </p>
            <div className="bg-primary/10 border border-primary/20 rounded p-3 text-left">
              <p className="text-xs text-muted-foreground">
                <span className="font-mono text-primary">{path}</span>
              </p>
            </div>
          </div>

          <Link to="/">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};
