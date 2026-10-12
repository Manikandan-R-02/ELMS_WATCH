import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, PieChart } from "lucide-react";
import { Card } from "../../../components/cards/Card";
import { ChartHeader, BarChartCard, DistributionChartCard } from "../../../components/charts/ChartCards";
import { useApiRequest } from "../../../api/useApiRequest";
import { formatAmount } from "../../../store/numberFormatStore";
import { fetchDayBasedData } from "./api";
import { monthLabel } from "./data";

export interface DailyWasteSectionProps {
  year: number;
  month: number;
  locationId: string;
  locationName?: string;
}

function safeFormatDate(iso: string): string {
  try {
    return format(parseISO(iso), "dd MMM");
  } catch {
    return iso;
  }
}

/**
 * The old screen's daily bar chart + the two per-day pies (Loss Reasons, Food Items) it revealed
 * once a bar was clicked — shown only once a specific location AND month are both known, exactly
 * like the old app. Fetches both `getDayBasedData` type views in parallel up front (matching the
 * old screen's own `Promise.all`) rather than re-fetching per day click, since both already carry
 * every day's detail in one response.
 */
export function DailyWasteSection({ year, month, locationId, locationName }: Readonly<DailyWasteSectionProps>) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const lossDays = useApiRequest(fetchDayBasedData);
  const foodDays = useApiRequest(fetchDayBasedData);

  useEffect(() => {
    setSelectedDate(null);
    lossDays.run(year, month, locationId, "Loss Reason");
    foodDays.run(year, month, locationId, "Food Item");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, locationId]);

  const barData = useMemo(
    () =>
      [...(lossDays.data ?? [])]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => ({ name: safeFormatDate(d.date), value: d.totalWasteValue, date: d.date })),
    [lossDays.data]
  );

  const selectedLossDay = lossDays.data?.find((d) => d.date === selectedDate);
  const selectedFoodDay = foodDays.data?.find((d) => d.date === selectedDate);

  const lossReasonPoints = (selectedLossDay?.lossReasonList ?? []).map((r) => ({ name: r.lossReason, value: r.sumOfCost }));
  const foodItemPoints = (selectedFoodDay?.foodItemByweight ?? []).map((r) => ({ name: `${r.foodCategory} — ${r.foodItem}`, value: r.sumOfCost }));

  return (
    <div className="space-y-4">
      {lossDays.loading && (
        <Card>
          <ChartHeader title={`Daily Waste — ${locationName ?? locationId} — ${monthLabel(month)} ${year}`} subtitle="Click a day to see its loss-reason and food-item breakdown" />
          <div className="flex h-64 items-center justify-center text-slate-400">
            <CalendarDays className="h-8 w-8 animate-pulse opacity-40" />
          </div>
        </Card>
      )}
      {!lossDays.loading && (barData.length === 0) && (
        <Card>
          <ChartHeader title={`Daily Waste — ${locationName ?? locationId} — ${monthLabel(month)} ${year}`} subtitle="Click a day to see its loss-reason and food-item breakdown" />
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-slate-400">
            <CalendarDays className="h-8 w-8 opacity-40" />
            <p className="text-sm">No daily data available</p>
          </div>
        </Card>
      )}
      {!lossDays.loading && barData.length !== 0 && (
        <BarChartCard
          title={`Daily Waste — ${locationName ?? locationId} — ${monthLabel(month)} ${year}`}
          subtitle="Click a day to see its loss-reason and food-item breakdown"
          data={barData}
          colors={["#2a78d6"]}
          onBarClick={(point) => setSelectedDate(String(point.date))}
        />
      )}

      {selectedDate && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {lossReasonPoints.length === 0 ? (
            <Card>
              <ChartHeader title="Loss Reasons" subtitle={`Breakdown of waste loss by reason for ${safeFormatDate(selectedDate)}`} />
              <div className="flex h-56 flex-col items-center justify-center gap-2 text-center text-slate-400">
                <PieChart className="h-7 w-7 opacity-40" />
                <p className="text-sm">No data for this day</p>
              </div>
            </Card>
          ) : (
            <DistributionChartCard
              title="Loss Reasons"
              subtitle={`Breakdown of waste loss by reason for ${safeFormatDate(selectedDate)}`}
              data={lossReasonPoints}
              formatValue={(v) => formatAmount(v)}
            />
          )}
          {foodItemPoints.length === 0 ? (
            <Card>
              <ChartHeader title="Food Items" subtitle={`Breakdown of waste cost by food item for ${safeFormatDate(selectedDate)}`} />
              <div className="flex h-56 flex-col items-center justify-center gap-2 text-center text-slate-400">
                <PieChart className="h-7 w-7 opacity-40" />
                <p className="text-sm">No data for this day</p>
              </div>
            </Card>
          ) : (
            <DistributionChartCard
              title="Food Items"
              subtitle={`Breakdown of waste cost by food item for ${safeFormatDate(selectedDate)}`}
              data={foodItemPoints}
              formatValue={(v) => formatAmount(v)}
            />
          )}
        </div>
      )}
    </div>
  );
}
