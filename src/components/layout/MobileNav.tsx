'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useState } from 'react';

export function MobileNav() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
                <div className="sr-only">
                    {/* Accessible title for screen readers */}
                    <SheetTitle>Navigation Menu</SheetTitle>
                </div>
                <Sidebar className="w-full" />
            </SheetContent>
        </Sheet>
    );
}
