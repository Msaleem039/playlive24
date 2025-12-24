"use client"

import { useMemo, useState } from "react"
import {
  SummaryCard,
  DataTable,
  SportsSelector,
} from "@/components/dashboardagent"
import { useGetDashboardDataQuery } from "@/app/services/Api"
import { CalendarDatePicker } from "@/components/DatePicker"
import { Button } from "@/components/utils/button"

const DEFAULT_DASHBOARD = {
  cash: {
    totalDeposit: 0,
    totalWithdraw: 0,
    clientBalance: 0,
  },
  risk: {
    totalExposure: 0,
  },
  pnl: {
    clientTotalPnl: 0,
    adminNetPnl: 0,
  },
  users: {
    byRole: [],
    totalActiveClient: 0,
  },
  topWinningPlayers: [],
  topLosingPlayers: [],
  topWinningMarkets: [],
  topLosingMarkets: [],
}

const formatNumber = (value: number | undefined | null) =>
  (value ?? 0).toLocaleString()

export function MyReportView() {
  const [fromDate, setFromDate] = useState<Date | null>(new Date())
  const [toDate, setToDate] = useState<Date | null>(new Date())
  const [selectedSport, setSelectedSport] = useState("")

  const { data, isLoading, isFetching, isError, refetch } =
    useGetDashboardDataQuery(undefined)

  const dashboardData = data ?? DEFAULT_DASHBOARD

  const userCountData = useMemo(() => {
    const base = (dashboardData.users?.byRole as Array<any>) ?? []
    const rows = base.map((item) => ({
      role: item.role ?? "N/A",
      count: formatNumber(item.count ?? 0),
    }))

    rows.push({
      role: "Total Active Client",
      count: formatNumber(dashboardData.users?.totalActiveClient ?? 0),
    })

    return rows
  }, [dashboardData])

  const topWinningPlayers = useMemo(
    () =>
      ((dashboardData.topWinningPlayers as Array<any>) ?? []).map((player) => ({
        player: player.player ?? player.username ?? player.name ?? "—",
        amount: formatNumber(player.amount ?? 0),
      })),
    [dashboardData],
  )

  const topLosingPlayers = useMemo(
    () =>
      ((dashboardData.topLosingPlayers as Array<any>) ?? []).map((player) => ({
        player: player.player ?? player.username ?? player.name ?? "—",
        amount: formatNumber(player.amount ?? 0),
      })),
    [dashboardData],
  )

  const topWinningMarkets = useMemo(
    () =>
      ((dashboardData.topWinningMarkets as Array<any>) ?? []).map((market) => ({
        sports: market.sports ?? market.sport ?? "—",
        market: market.market ?? market.name ?? "—",
        amount: formatNumber(market.amount ?? 0),
      })),
    [dashboardData],
  )

  const topLosingMarkets = useMemo(
    () =>
      ((dashboardData.topLosingMarkets as Array<any>) ?? []).map((market) => ({
        sports: market.sports ?? market.sport ?? "—",
        market: market.market ?? market.name ?? "—",
        amount: formatNumber(market.amount ?? 0),
      })),
    [dashboardData],
  )

  const sportsOptions = [
    "Cricket",
    "Soccer",
    "Tennis",
    "Horse Racing",
    "Basketball",
  ]

  const handleSubmit = () => {
    refetch()
  }

  const handleReset = () => {
    const resetDate = new Date()
    setFromDate(resetDate)
    setToDate(resetDate)
    setSelectedSport("")
    refetch()
  }

  const showLoadingState = isLoading || isFetching

  return (
    <div className="bg-gray-100">
      <div className="bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">From Date</label>
            <CalendarDatePicker
              value={fromDate}
              onValueChange={setFromDate}
              maxDate={toDate ?? undefined}
              showPopperArrow={false}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">To Date</label>
            <CalendarDatePicker
              value={toDate}
              onValueChange={setToDate}
              minDate={fromDate ?? undefined}
              showPopperArrow={false}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSubmit}
              className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-5"
            >
              Submit
            </Button>
            <Button
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-700 text-white px-5"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {isError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Unable to load dashboard summary. Please try again later.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            title="TOTAL DEPOSIT"
            value={showLoadingState ? "…" : formatNumber(dashboardData.cash?.totalDeposit)}
            color="green"
          />
          <SummaryCard
            title="TOTAL WITHDRAW"
            value={showLoadingState ? "…" : formatNumber(dashboardData.cash?.totalWithdraw)}
            color="red"
          />
          <SummaryCard
            title="CLIENT BALANCE"
            value={showLoadingState ? "…" : formatNumber(dashboardData.cash?.clientBalance)}
            color="green"
          />
          <SummaryCard
            title="TOTAL EXPOSURE"
            value={showLoadingState ? "…" : formatNumber(dashboardData.risk?.totalExposure)}
            color="black"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <DataTable
            title="USER COUNT"
            columns={[
              { key: "role", label: "Role", align: "left" },
              { key: "count", label: "Count", align: "right" },
            ]}
            data={showLoadingState ? [] : userCountData}
            emptyMessage={showLoadingState ? "Loading…" : "No data available"}
          />
          <DataTable
            title="TOP 5 WINNING PLAYER"
            columns={[
              { key: "player", label: "Player", align: "left" },
              { key: "amount", label: "Amount", align: "right" },
            ]}
            data={showLoadingState ? [] : topWinningPlayers}
            emptyMessage={showLoadingState ? "Loading…" : "No winning players"}
          />
          <DataTable
            title="TOP 5 LOSING PLAYER"
            columns={[
              { key: "player", label: "Player", align: "left" },
              { key: "amount", label: "Amount", align: "right" },
            ]}
            data={showLoadingState ? [] : topLosingPlayers}
            emptyMessage={showLoadingState ? "Loading…" : "No losing players"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 pb-4">
          <SportsSelector
            selectedSport={selectedSport}
            onSportChange={setSelectedSport}
            sports={sportsOptions}
          />
          <DataTable
            title="TOP 5 WINNING MARKETS"
            columns={[
              { key: "sports", label: "Sports", align: "left" },
              { key: "market", label: "Market", align: "left" },
              { key: "amount", label: "Amount", align: "right" },
            ]}
            data={showLoadingState ? [] : topWinningMarkets}
            emptyMessage={showLoadingState ? "Loading…" : "No winning markets"}
          />
          <DataTable
            title="TOP 5 LOSING MARKETS"
            columns={[
              { key: "sports", label: "Sports", align: "left" },
              { key: "market", label: "Market", align: "left" },
              { key: "amount", label: "Amount", align: "right" },
            ]}
            data={showLoadingState ? [] : topLosingMarkets}
            emptyMessage={showLoadingState ? "Loading…" : "No losing markets"}
          />
        </div>
      </div>
    </div>
  )
}
