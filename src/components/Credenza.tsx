import type { ComponentProps } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import { cn } from "#/lib/utils";

function Credenza(props: ComponentProps<typeof Dialog>) {
  return <Dialog {...props} />;
}

function CredenzaTrigger(props: ComponentProps<typeof DialogTrigger>) {
  return <DialogTrigger {...props} />;
}

function CredenzaClose(props: ComponentProps<typeof DialogClose>) {
  return <DialogClose {...props} />;
}

function CredenzaContent({ className, ...props }: ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn(
        "top-auto bottom-0 left-0 w-full max-w-none translate-x-0 translate-y-0 rounded-t-[2rem] rounded-b-none border-x-0 border-b-0 px-5 py-6 md:top-1/2 md:bottom-auto md:left-1/2 md:w-[min(100%-2rem,36rem)] md:max-w-[36rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[2rem] md:border md:px-6 md:pt-6 md:pb-8",
        className,
      )}
      {...props}
    />
  );
}

function CredenzaHeader(props: ComponentProps<"div">) {
  return <DialogHeader {...props} />;
}

function CredenzaFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <DialogFooter
      className={cn(
        "flex-col gap-2 sm:flex-col sm:justify-start md:flex-row md:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function CredenzaTitle(props: ComponentProps<typeof DialogTitle>) {
  return <DialogTitle {...props} />;
}

function CredenzaDescription(props: ComponentProps<typeof DialogDescription>) {
  return <DialogDescription {...props} />;
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
