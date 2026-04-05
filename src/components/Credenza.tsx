import type { ComponentProps } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

function Credenza(props: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="credenza" {...props} />;
}

function CredenzaTrigger(props: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="credenza-trigger" {...props} />;
}

function CredenzaClose(props: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="credenza-close" {...props} />;
}

function CredenzaContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="credenza-overlay"
        className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      />
      <DialogPrimitive.Content
        data-slot="credenza-content"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-svh flex-col gap-4 overflow-y-auto rounded-t-[2rem] border border-border border-b-0 bg-card px-5 pt-6 pb-8 shadow-2xl duration-200 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:top-1/2 md:bottom-auto md:left-1/2 md:max-h-[calc(100vh-2rem)] md:w-[min(100%-2rem,36rem)] md:max-w-[36rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[2rem] md:border md:px-6 md:pt-6 md:pb-8 md:data-[state=closed]:fade-out-0 md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=closed]:zoom-out-95 md:data-[state=open]:fade-in-0 md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        <div className="mx-auto h-1.5 w-14 rounded-full bg-border md:hidden" />
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close asChild>
            <Button type="button" variant="ghost" size="icon-sm" className="absolute top-4 right-4">
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function CredenzaHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

function CredenzaFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-col sm:justify-start md:flex-row md:justify-end [&>[data-slot=button]]:h-11 [&>[data-slot=button]]:rounded-2xl [&>[data-slot=button]]:px-4 [&>[data-slot=button]]:text-sm md:[&>[data-slot=button]]:h-7 md:[&>[data-slot=button]]:rounded-md md:[&>[data-slot=button]]:px-2 md:[&>[data-slot=button]]:text-xs",
        className,
      )}
      {...props}
    />
  );
}

function CredenzaTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="credenza-title"
      className={cn("display-title text-2xl font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function CredenzaDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="credenza-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Credenza,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
};
