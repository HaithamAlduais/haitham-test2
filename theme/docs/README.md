# Ramsha / Eventflow Hub

Top-level directories are **`landing/`**, **`provider/`**, **`participant/`**, **`docs/`** (this file + rules), and **`theme/`**. There is **no bundled backend** in this repo; provider workspace screens that call `/api/*` expect a separate API if you add one later. Root keeps minimal tooling files (`.gitignore`, `jsconfig.json`).

If a leftover **`connection/node_modules`** folder appears (file lock from an old dev server), close terminals/IDE processes that use it and delete the **`connection/`** directory manually; it is obsolete and listed in `.gitignore`.

## Repository layout

| Path | Purpose |
|------|--------|
| **`landing/`** | Vite/React app shell: `package.json`, `src/` (shared UI, auth, demos, marketing `landing/` feature), `html/`/`js/` static previews, `public/`, Tailwind, ESLint, tests |
| **`provider/`** | Provider static hub (`html/`, `js/`) + **`src/`** React (workspace, sessions, events, live monitor) |
| **`participant/`** | Participant static hub + **`src/`** React (profile, marketplace, Ramsha participant home, API settings console) |
| **`docs/`** | Project README (this file), `ramsha-rules/` |
| **`theme/`** | Shared CSS (`ramsha-unified.css`) for static HTML |

### Static pages (open in browser)

- Landing hub: `landing/html/index.html`
- Provider hub: `provider/html/index.html`
- Participant hub: `participant/html/index.html`

Use relative links between pages; each area keeps its own `css/` and `js/` so folders stay self-contained.

### React app (Vite)

1. `cd landing && npm install`
2. `npm run dev` — dev server on port **8080** (run from **`landing/`**).
3. `npm run build` — output to **`landing/dist/`** (ignored by git).
4. `npm run lint` — from **repo root** (`npm run lint`); lints `landing/src`, `provider/src`, and `participant/src` via root `eslint.config.js`.

**Path alias:** `@/*` → `landing/src/*`. Root **`jsconfig.json`** mirrors this for the editor.

### Auth and route policy (React)

- **Public:** `/`, `/login`, `/signup`, `/forgot-password`, `/email-verified`, `/verify-email`, `/reset-password`, `/events/p/:slug`.
- **Any signed-in user (`RequireAuth`):** onboarding, marketplace, profile, demos, `/settings`, `/settings/console` (API-backed Ramsha-style settings), `/participant/home`, etc.
- **Organizer-only (`RouteGuard` + `organizer` role):** `/provider`, `/provider/workspace`, and organizer demo routes (hackathon/webinar/workshop/event creators, live monitors, etc.). Workspace pages use `fetch` to **`/api/*`**; without a reverse proxy or `VITE_API_URL`, those calls will not reach a server until you host an API yourself.

Legacy paths **`/dashboard`** and **`/home`** redirect to **`/provider`** and **`/marketplace`**.

---
# Neobrutalism Component Libraries (shadcn-based)

This page collects the install commands + example usages for Neobrutalism UI components (sourced from `https://neobrutalism.dev/r/*.json`).

## Install (pattern)

For any component `X`, install with:

```bash
pnpm dlx shadcn@latest add -y -o https://neobrutalism.dev/r/X.json
```

> Run these from **`landing/`** so new files land in **`landing/src/components/ui/`**.

---

## accordion

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/accordion.json
```

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

<Accordion type="single" collapsible className="w-full max-w-xl">
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

---

## alert-dialog

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/alert-dialog.json
```

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button>Open</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your
        account and remove your data from our servers.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## alert

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/alert.json
```

```tsx
import { CheckCircle2Icon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

<Alert>
  <CheckCircle2Icon />
  <AlertTitle>Success! Your changes have been saved</AlertTitle>
  <AlertDescription>
    This is an alert with icon, title and description.
  </AlertDescription>
</Alert>
```

---

## avatar

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/avatar.json
```

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>
```

---

## badge

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/badge.json
```

```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Badge</Badge>
```

---

## breadcrumb

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/breadcrumb.json
```

```tsx
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1">
          <BreadcrumbEllipsis className="size-4" />
          <span className="sr-only">Toggle menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem>Documentation</DropdownMenuItem>
          <DropdownMenuItem>Themes</DropdownMenuItem>
          <DropdownMenuItem>GitHub</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/components">Components</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

---

## button

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/button.json
```

```tsx
import { Button } from "@/components/ui/button"

<Button>Default</Button>
```

---

## calendar (date picker)

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/calendar.json
```

```tsx
import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const [date, setDate] = useState<Date | undefined>(new Date())

<Popover>
  <PopoverTrigger asChild>
    <Button variant="noShadow" className="w-[280px] justify-start text-left font-base">
      <CalendarIcon />
      {date ? format(date, "PPP") : <span>Pick a date</span>}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto border-0 p-0">
    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
  </PopoverContent>
</Popover>
```

---

## card

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/card.json
```

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

<Card className="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Login to your account</CardTitle>
    <CardDescription>
      Enter your email below to login to your account
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form>
      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </div>
      </div>
    </form>
  </CardContent>
  <CardFooter className="flex-col gap-2">
    <Button type="submit" className="w-full">Login</Button>
    <Button variant="neutral" className="w-full">Login with Google</Button>
  </CardFooter>
</Card>
```

---

## carousel

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/carousel.json
```

```tsx
import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

<div className="w-full flex-col items-center gap-4 flex">
  <Carousel className="w-full max-w-[200px]">
    <CarouselContent>
      {Array.from({ length: 5 }).map((_, index) => (
        <CarouselItem key={index}>
          <div className="p-[10px]">
            <Card className="shadow-none p-0 bg-main text-main-foreground">
              <CardContent className="flex aspect-square items-center justify-center p-4">
                <span className="text-3xl font-base">{index + 1}</span>
              </CardContent>
            </Card>
          </div>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>
</div>
```

---

## chart

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/chart.json
```

```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Pie, PieChart } from "recharts"
import { TrendingUp } from "lucide-react"

// See `src/components/ui/chart.tsx` for full implementation.
export default function ChartDemo() {
  return (
    <Card className="bg-secondary-background text-foreground">
      <CardHeader className="items-center pb-0">
        <CardTitle>Pie Chart</CardTitle>
        <CardDescription>Example</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={{ visitors: { label: "Visitors" } }}>
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={[{ value: 1, fill: "var(--color-chrome)" }]} dataKey="value" nameKey="visitors" />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
        Trending up <TrendingUp className="h-4 w-4" />
      </div>
    </Card>
  )
}
```

---

## checkbox

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/checkbox.json
```

```tsx
import { Checkbox } from "@/components/ui/checkbox"
<Checkbox />
```

---

## collapsible

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/collapsible.json
```

```tsx
import { ChevronsUpDown } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function CollapsibleDemo() {
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[350px] space-y-2">
      <div className="rounded-base flex items-center justify-between space-x-4 border-2 border-border bg-main px-4 py-2">
        <h4 className="text-sm font-heading">@peduarte starred 3 repositories</h4>
        <CollapsibleTrigger asChild>
          <Button variant="noShadow" size="sm" className="w-9 bg-secondary-background text-foreground p-0">
            <ChevronsUpDown className="size-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2 text-main-foreground font-base">
        <div className="rounded-base border-2 border-border bg-main px-4 py-3 font-mono text-sm">@radix-ui/primitives</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

---

## command

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/command.json
```

```tsx
import * as React from "react"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"

// Demo code requires some app glue; see `src/components/ui/command.tsx` for full primitives.
```

---

## context-menu

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/context-menu.json
```

```tsx
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@/components/ui/context-menu"

<ContextMenu>
  <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-text border-dashed text-sm font-base">
    Right click here
  </ContextMenuTrigger>
  <ContextMenuContent className="w-64">
    <ContextMenuLabel>Menu</ContextMenuLabel>
    <ContextMenuItem inset>Reload <ContextMenuShortcut>⌘R</ContextMenuShortcut></ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuSub>
      <ContextMenuSubTrigger inset>More Tools</ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-48">
        <ContextMenuItem>Save Page As...</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  </ContextMenuContent>
</ContextMenu>
```

---

## dialog

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/dialog.json
```

```tsx
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DialogDemo() {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button>Edit Profile</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Name</Label>
              <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="neutral">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
```

---

## drawer

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/drawer.json
```

```tsx
import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"

<Drawer>
  <DrawerTrigger asChild>
    <Button>Open</Button>
  </DrawerTrigger>
  <DrawerContent>
    <div className="mx-auto w-[300px]">
      <DrawerHeader>
        <DrawerTitle>Are you absolutely sure?</DrawerTitle>
        <DrawerDescription>This action cannot be undone.</DrawerDescription>
      </DrawerHeader>
      <DrawerFooter className="grid grid-cols-2">
        <Button variant="noShadow">Submit</Button>
        <DrawerClose asChild>
          <Button variant="noShadow" className="bg-secondary-background text-foreground">Cancel</Button>
        </DrawerClose>
      </DrawerFooter>
    </div>
  </DrawerContent>
</Drawer>
```

---

## dropdown-menu

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/dropdown-menu.json
```

```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Open</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-56">
    <DropdownMenuItem onClick={() => {}}>
      <User className="h-4 w-4" />
      Profile
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## form

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/form.json
```

```tsx
// Uses react-hook-form + zodResolver; see `src/components/ui/form.tsx` for primitives.
```

---

## hover-card

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/hover-card.json
```

```tsx
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

<HoverCard>
  <HoverCardTrigger asChild>
    <Button>Hover</Button>
  </HoverCardTrigger>
  <HoverCardContent>
    Preview content.
  </HoverCardContent>
</HoverCard>
```

---

## image-card

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/image-card.json
```

```tsx
import ImageCard from "@/components/ui/image-card"

<ImageCard
  caption="Image"
  imageUrl="https://hips.hearstapps.com/hmg-prod/images/flowers-trees-and-bushes-reach-their-peak-of-full-bloom-in-news-photo-1678292967.jpg?resize=300:*"
/>
```

---

## input OTP

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/input-otp.json
```

```tsx
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"

<InputOTP maxLength={6}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>
```

---

## input

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/input.json
```

```tsx
import { Input } from "@/components/ui/input"

<Input type="email" placeholder="Email" className="w-[200px]" />
```

---

## label

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/label.json
```

```tsx
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>
```

---

## marquee

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/marquee.json
```

```tsx
import Marquee from "@/components/ui/marquee"

const items = ["Item 1", "Item 2", "Item 3", "Item 4"]
<Marquee items={items} />
```

---

## menubar

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/menubar.json
```

```tsx
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from "@/components/ui/menubar"

<Menubar>
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>New Tab</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>
```

---

## navigation-menu

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/navigation-menu.json
```

```tsx
// Existing `src/components/ui/navigation-menu.tsx` already provides the primitives.
```

---

## pagination

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/pagination.json
```

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>
        2
      </PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

---

## popover

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/popover.json
```

```tsx
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

<Popover>
  <PopoverTrigger asChild>
    <Button>Open popover</Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    Content inside popover.
  </PopoverContent>
</Popover>
```

---

## progress

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/progress.json
```

```tsx
import * as React from "react"
import { Progress } from "@/components/ui/progress"

export default function ProgressDemo() {
  const [progress, setProgress] = React.useState(13)
  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])
  return <Progress value={progress} className="w-[60%]" />
}
```

---

## radio-group

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/radio-group.json
```

```tsx
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

<RadioGroup defaultValue="comfortable">
  <div className="flex items-center gap-2">
    <RadioGroupItem value="default" id="r1" />
    <Label htmlFor="r1">Default</Label>
  </div>
</RadioGroup>
```

---

## resizable

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/resizable.json
```

```tsx
import {
  Resizable,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={50}>
    <div className="h-[200px] flex items-center justify-center bg-main border-2 border-border">
      One
    </div>
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={50}>
    <div className="h-[200px] flex items-center justify-center bg-main border-2 border-border">
      Two
    </div>
  </ResizablePanel>
</ResizablePanelGroup>
```

---

## scroll-area

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/scroll-area.json
```

```tsx
import { ScrollArea } from "@/components/ui/scroll-area"

<ScrollArea className="rounded-base h-[200px] w-[350px] border-2 border-border bg-main p-4 shadow-shadow">
  Scroll content...
</ScrollArea>
```

---

## select

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/select.json
```

```tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Fruits</SelectLabel>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

---

## sheet

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/sheet.json
```

```tsx
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

<Sheet>
  <SheetTrigger asChild>
    <Button>Open</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Edit profile</SheetTitle>
    </SheetHeader>
    <SheetFooter>
      <Button type="submit">Save changes</Button>
      <SheetClose asChild>
        <Button variant="neutral">Cancel</Button>
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

---

## sidebar

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/sidebar.json
```

```tsx
// Sidebar requires wrapping the app with SidebarProvider/SidebarInset.
// See `src/components/ui/sidebar.tsx` + your existing layout patterns.
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb"

<SidebarProvider>
  <SidebarInset>
    <header>
      <SidebarTrigger />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Data Fetching</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  </SidebarInset>
</SidebarProvider>
```

---

## skeleton

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/skeleton.json
```

```tsx
import { Skeleton } from "@/components/ui/skeleton"

<Skeleton className="h-12 w-12 rounded-full" />
```

---

## slider

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/slider.json
```

```tsx
import { Slider } from "@/components/ui/slider"

<Slider defaultValue={[33]} max={100} step={1} />
```

---

## sonner

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/sonner.json
```

```tsx
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

<Button onClick={() => toast("Event has been created")}>
  Show Toast
</Button>
```

---

## switch

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/switch.json
```

```tsx
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

<div className="flex items-center gap-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>
```

---

## table

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/table.json
```

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>INV001</TableCell>
      <TableCell>Paid</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## tabs

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/tabs.json
```

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    <Card>
      <CardContent>Account tab content</CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

---

## textarea

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/textarea.json
```

```tsx
import { Textarea } from "@/components/ui/textarea"

<Textarea placeholder="Type here..." />
```

---

## tooltip

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/tooltip.json
```

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button>Hover</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Add to library</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## combobox

```bash
pnpm dlx shadcn@latest add https://neobrutalism.dev/r/combobox.json
```

```tsx
"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const frameworks = [
  { value: "next.js", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
]

export default function ComboboxDemo() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="noShadow" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value ? frameworks.find((f) => f.value === value)?.label : "Select framework..."}
          <ChevronsUpDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 border-0">
        <Command>
          <CommandInput placeholder="Search framework..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {frameworks.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  {framework.label}
                  <CheckIcon className="ml-auto h-4 w-4 opacity-0" />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

---

## data table

Data table demos are typically composed from `Table` + `Checkbox` + `DropdownMenu` + `Input`.

```tsx
"use client"

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

export default function SimpleDataTableDemo() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">Sel</TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>
            <Checkbox aria-label="Select row" />
          </TableCell>
          <TableCell>INV001</TableCell>
          <TableCell>Paid</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}
```


