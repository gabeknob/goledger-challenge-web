import * as React from "react";

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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "#/components/ui/sheet";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateMatches = () => setIsDesktop(mediaQuery.matches);

    updateMatches();
    mediaQuery.addEventListener("change", updateMatches);

    return () => mediaQuery.removeEventListener("change", updateMatches);
  }, []);

  return isDesktop;
}

function Credenza({ children, ...props }: React.ComponentProps<typeof Dialog>) {
  const isDesktop = useIsDesktop();
  const Root = isDesktop ? Dialog : Sheet;

  return <Root {...props}>{children}</Root>;
}

function CredenzaTrigger({ children, ...props }: React.ComponentProps<typeof DialogTrigger>) {
  const isDesktop = useIsDesktop();
  const Trigger = isDesktop ? DialogTrigger : SheetTrigger;

  return <Trigger {...props}>{children}</Trigger>;
}

function CredenzaClose({ children, ...props }: React.ComponentProps<typeof DialogClose>) {
  const isDesktop = useIsDesktop();
  const Close = isDesktop ? DialogClose : SheetClose;

  return <Close {...props}>{children}</Close>;
}

function CredenzaContent({ children, ...props }: React.ComponentProps<typeof DialogContent>) {
  const isDesktop = useIsDesktop();
  const Content = isDesktop ? DialogContent : SheetContent;

  return <Content {...props}>{children}</Content>;
}

function CredenzaHeader({ children, ...props }: React.ComponentProps<"div">) {
  const isDesktop = useIsDesktop();
  const Header = isDesktop ? DialogHeader : SheetHeader;

  return <Header {...props}>{children}</Header>;
}

function CredenzaFooter({ children, ...props }: React.ComponentProps<"div">) {
  const isDesktop = useIsDesktop();
  const Footer = isDesktop ? DialogFooter : SheetFooter;

  return <Footer {...props}>{children}</Footer>;
}

function CredenzaTitle({ children, ...props }: React.ComponentProps<typeof DialogTitle>) {
  const isDesktop = useIsDesktop();
  const Title = isDesktop ? DialogTitle : SheetTitle;

  return <Title {...props}>{children}</Title>;
}

function CredenzaDescription({
  children,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const isDesktop = useIsDesktop();
  const Description = isDesktop ? DialogDescription : SheetDescription;

  return <Description {...props}>{children}</Description>;
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
