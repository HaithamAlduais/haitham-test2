import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Cell, Label, Pie, PieChart } from "recharts";
import { TrendingUp } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useAnimatedNumber } from "../hooks/useAnimatedNumber";
import { getLandingCopy } from "./landingLocale";

const PIE_ROWS = [
  { type: "workshops", visitors: 320 },
  { type: "webinars", visitors: 240 },
  { type: "hackathons", visitors: 180 },
  { type: "bootcamps", visitors: 140 },
];

function StatBlock({ value, suffix = "", label }) {
  const n = useAnimatedNumber(value, 1600);
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-3xl font-black tabular-nums text-main sm:text-4xl">
        {n.toLocaleString()}
        {suffix}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function LandingIntro() {
  const { lang } = useLanguage();
  const { isOrganizer } = useTheme();
  const L = getLandingCopy(lang);
  const intro = isOrganizer ? L.introOrganizer : L.introParticipant;

  const pieData = useMemo(
    () =>
      PIE_ROWS.map((row) => ({
        ...row,
        fill: `var(--color-${row.type})`,
      })),
    []
  );

  const totalVisitors = useMemo(() => PIE_ROWS.reduce((acc, d) => acc + d.visitors, 0), []);

  const chartConfig = {
    workshops: { label: intro.chartTypes.workshops, color: "var(--chart-1)" },
    webinars: { label: intro.chartTypes.webinars, color: "var(--chart-2)" },
    hackathons: { label: intro.chartTypes.hackathons, color: "var(--chart-3)" },
    bootcamps: { label: intro.chartTypes.bootcamps, color: "var(--chart-4)" },
  };

  const localeTag = lang === "ar" ? "ar" : "en";

  return (
    <section id="intro" className="scroll-mt-28 bg-transparent">
      {/* Hero — centered, large typography */}
      <div className="flex flex-col items-center px-4 pb-16 pt-24 text-center sm:pt-32 sm:pb-20">
        {/* Eyebrow badge */}
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-main/30 bg-main/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-main">
          <span className="h-1.5 w-1.5 rounded-full bg-main" />
          {intro.eyebrow}
        </span>

        {/* Main headline */}
        <h1 className="mx-auto max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl">
          {intro.h1Part1}
          <span className="text-main">{intro.h1Accent1}</span>
          {intro.h1Mid}
          <span className="text-main">{intro.h1Accent2}</span>
          {intro.h1Mid2}
          <span className="text-main">{intro.h1Accent3}</span>
          {intro.h1End}
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {intro.paragraph}
        </p>

        {/* Stats row */}
        <div className="mt-12 flex items-center gap-8 sm:gap-14">
          <StatBlock value={7000} suffix="+" label={intro.statLabels[0]} />
          <div className="h-10 w-px bg-border" />
          <StatBlock value={34} suffix="+" label={intro.statLabels[1]} />
          <div className="h-10 w-px bg-border" />
          <StatBlock value={100} suffix="%" label={intro.statLabels[2]} />
        </div>
      </div>

      {/* Chart card — centered below hero */}
      <div className="container mx-auto max-w-2xl px-4 pb-14 sm:pb-20">
        <div className="overflow-hidden rounded-2xl border border-border bg-card/40 p-5 backdrop-blur-lg sm:p-7">
          <div className="mb-2">
            <h3 className="text-sm font-black uppercase tracking-wide text-foreground">
              {intro.chartTitle}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{intro.chartSubtitle}</p>
          </div>
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[220px] w-full sm:max-h-[260px]"
          >
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={pieData}
                dataKey="visitors"
                nameKey="type"
                innerRadius={58}
                strokeWidth={2}
                stroke="var(--border)"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.type} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      const cx = viewBox.cx;
                      const cy = viewBox.cy;
                      return (
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan
                            x={cx}
                            y={cy}
                            className="fill-foreground text-2xl font-black tabular-nums sm:text-3xl"
                          >
                            {totalVisitors.toLocaleString(localeTag)}
                          </tspan>
                          <tspan
                            x={cx}
                            y={(cy ?? 0) + 22}
                            className="fill-muted-foreground text-[10px] font-bold uppercase tracking-wide"
                          >
                            {intro.chartCenterCaption}
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4 text-sm">
            <div className="flex items-center gap-2 font-medium leading-none text-foreground">
              <TrendingUp className="h-4 w-4 shrink-0 text-main" strokeWidth={2.5} />
              {intro.chartFooter}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{intro.chartFooterDetail}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
