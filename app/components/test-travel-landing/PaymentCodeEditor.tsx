// components/PaymentCodeEditor.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { usePayment } from "./PaymentContext"; 
import { Code2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export function PaymentCodeEditor() {
  const { embedCode, setEmbedCode, isCustomCode, setIsCustomCode } = usePayment();
  const [tempCode, setTempCode] = useState(embedCode);
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [buttonText, setButtonText] = useState("Pay Now");
  const [bgColor, setBgColor] = useState("#2563eb");
  const [textColor, setTextColor] = useState("#ffffff");

  useEffect(() => {
    if (isOpen) {
      setTempCode(embedCode);
      // Try to parse existing code to extract URL and text
      try {
        const hrefMatch = embedCode.match(/href="([^"]+)"/);
        const textMatch = embedCode.match(/>([^<]+)<\/a>/);
        const bgMatch = embedCode.match(/background:([^;]+);/);
        const colorMatch = embedCode.match(/color:([^;]+);/);
        
        if (hrefMatch) setUrl(hrefMatch[1]);
        if (textMatch) setButtonText(textMatch[1]);
        if (bgMatch) setBgColor(bgMatch[1].trim());
        if (colorMatch) setTextColor(colorMatch[1].trim());
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, [isOpen, embedCode]);

  const generateButtonCode = () => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background:${bgColor};color:${textColor};text-decoration:none;border-radius:8px;font-weight:600;">${buttonText}</a>`;
  };

  const handleApply = () => {
    if (url) {
      const newCode = generateButtonCode();
      setEmbedCode(newCode);
      setTempCode(newCode);
      setIsCustomCode(true);
      setIsOpen(false);
    }
  };

  const handleReset = () => {
    const defaultCode = `<a href="https://www.zidwell.com/pay/web-dev-9188" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Pay Now</a>`;
    setEmbedCode(defaultCode);
    setTempCode(defaultCode);
    setIsCustomCode(false);
    setUrl("https://www.zidwell.com/pay/web-dev-9188");
    setButtonText("Pay Now");
    setBgColor("#2563eb");
    setTextColor("#ffffff");
    setIsOpen(false);
  };

  const handleCustomCodeApply = () => {
    setEmbedCode(tempCode);
    setIsCustomCode(true);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Code2 className="h-3.5 w-3.5" />
          Customize Button
          {isCustomCode && (
            <span className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Customize Payment Button
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="builder" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="builder">Visual Builder</TabsTrigger>
            <TabsTrigger value="code">HTML Code</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="payment-url">Payment URL</Label>
                <Input
                  id="payment-url"
                  placeholder="https://your-payment-link.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the URL where users should be redirected to complete payment
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="button-text">Button Text</Label>
                <Input
                  id="button-text"
                  placeholder="Pay Now"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bg-color">Background Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="bg-color"
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="text-color"
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <Label>Preview</Label>
                <div className="flex justify-center p-4 bg-muted rounded-lg">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: url ? generateButtonCode() : '<span class="text-muted-foreground">Enter a URL to preview</span>',
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset to Default
                </Button>
                <Button onClick={handleApply}>
                  Apply Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code" className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="custom-code">Paste your custom HTML code</Label>
              <Textarea
                id="custom-code"
                value={tempCode}
                onChange={(e) => setTempCode(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                placeholder="<a href='https://...' target='_blank'>Pay Now</a>"
              />
              <p className="text-xs text-muted-foreground">
                Paste any HTML button code (anchor tag, button, form, etc.)
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <Label>Preview</Label>
              <div className="flex justify-center p-4 bg-muted rounded-lg">
                <div
                  dangerouslySetInnerHTML={{
                    __html: tempCode || '<span class="text-muted-foreground">Enter HTML code to preview</span>',
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset to Default
              </Button>
              <Button onClick={handleCustomCodeApply}>
                Apply Custom Code
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {isCustomCode && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <Check className="h-4 w-4" />
            Using custom payment button
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}