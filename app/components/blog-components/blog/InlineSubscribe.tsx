"use client"
import { useState } from "react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Mail } from "lucide-react";

const InlineSubscribe = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you for subscribing!");
    setEmail("");
  };

  return (
    <div className="my-10 py-8 px-6 bg-secondary/30 rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-5 h-5 text-accent" />
        <h4 className="font-semibold">Enjoying this article?</h4>
      </div>
      <p className="text-muted-foreground mb-4">
        Subscribe to our newsletter and get the latest financial insights delivered to your inbox weekly.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
          Subscribe
        </Button>
      </form>
    </div>
  );
};

export default InlineSubscribe;
