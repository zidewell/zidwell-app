"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const filters = ["Daily", "Weekly", "Monthly", "Yearly"] as any;

const bookkeepingData = [
  { name: "Mon", income: 420, expenses: 180 },
  { name: "Tue", income: 380, expenses: 220 },
  { name: "Wed", income: 510, expenses: 150 },
  { name: "Thu", income: 290, expenses: 310 },
  { name: "Fri", income: 600, expenses: 200 },
  { name: "Sat", income: 350, expenses: 120 },
  { name: "Sun", income: 450, expenses: 180 },
];

const walletData = [
  { name: "Mon", funded: 300, spent: 120 },
  { name: "Tue", funded: 0, spent: 200 },
  { name: "Wed", funded: 500, spent: 80 },
  { name: "Thu", funded: 150, spent: 310 },
  { name: "Fri", funded: 0, spent: 90 },
  { name: "Sat", funded: 400, spent: 60 },
  { name: "Sun", funded: 200, spent: 150 },
];

const invoiceData = [
  { name: "Mon", sent: 5, paid: 3 },
  { name: "Tue", sent: 3, paid: 2 },
  { name: "Wed", sent: 6, paid: 5 },
  { name: "Thu", sent: 4, paid: 4 },
  { name: "Fri", sent: 8, paid: 6 },
  { name: "Sat", sent: 2, paid: 1 },
  { name: "Sun", sent: 3, paid: 2 },
];

const receiptData = [
  { name: "Mon", issued: 4, value: 120 },
  { name: "Tue", issued: 6, value: 180 },
  { name: "Wed", issued: 3, value: 90 },
  { name: "Thu", issued: 5, value: 210 },
  { name: "Fri", issued: 7, value: 300 },
  { name: "Sat", issued: 2, value: 60 },
  { name: "Sun", issued: 3, value: 100 },
];

const contractPie = [
  { name: "Active", value: 40 },
  { name: "Completed", value: 35 },
  { name: "Expiring", value: 15 },
  { name: "Draft", value: 10 },
];

const PIE_COLORS = ["#2b825b", "#3b82f6", "#f5b041", "#808080"];

const ChartCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-[#ffffff] dark:bg-[#171717] border-2 border-[#242424] dark:border-[#474747] rounded-md p-5 shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]">
    <h4 className="text-sm  font-bold text-[#141414] dark:text-[#f5f5f5] mb-5 uppercase tracking-wide">
      {title}
    </h4>
    {children}
  </div>
);

const DashboardCharts = () => {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Daily");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        {filters.map((f: any) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md text-sm  font-bold uppercase tracking-wide border-2 border-[#242424] dark:border-[#474747] transition-all ${
              filter === f
                ? "bg-[#2b825b] dark:bg-[#2b825b] text-white shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]"
                : "bg-[#ffffff] dark:bg-[#171717] text-[#6b6b6b] dark:text-[#a6a6a6] hover:text-[#141414] dark:hover:text-[#f5f5f5] hover:bg-[#f0efe7] dark:hover:bg-[#242424]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="w-full">
        <div className="flex flex-wrap gap-2 bg-[#ffffff] dark:bg-[#171717] border-2 border-[#242424] dark:border-[#474747] rounded-md p-2">
          {["bookkeeping", "wallet", "invoices", "receipts", "contracts"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`px-4 py-2 text-sm  font-bold uppercase tracking-wide rounded-md transition-all ${
                  filter === tab
                    ? "bg-[#2b825b] dark:bg-[#2b825b] text-white"
                    : "text-[#6b6b6b] dark:text-[#a6a6a6] hover:text-[#141414] dark:hover:text-[#f5f5f5]"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ),
          )}
        </div>

        <div className="mt-5">
          {filter === "bookkeeping" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ChartCard title="Income vs Expenses">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={bookkeepingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#999999", fontWeight: 600 }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#999999", fontWeight: 600 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#171717",
                        border: "2px solid #474747",
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#2b825b"
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#db3a34"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Spending Categories">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ResponsiveContainer
                    width="100%"
                    height={200}
                    className="max-w-[240px]"
                  >
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Operations", value: 35 },
                          { name: "Marketing", value: 20 },
                          { name: "Payroll", value: 25 },
                          { name: "Utilities", value: 10 },
                          { name: "Other", value: 10 },
                        ]}
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {[
                          "#2b825b",
                          "#3b82f6",
                          "#f5b041",
                          "#db3a34",
                          "#808080",
                        ].map((c, i) => (
                          <Cell key={i} fill={c} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#171717",
                          border: "2px solid #474747",
                          borderRadius: 4,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { n: "Operations", v: 35 },
                      { n: "Marketing", v: 20 },
                      { n: "Payroll", v: 25 },
                      { n: "Utilities", v: 10 },
                      { n: "Other", v: 10 },
                    ].map((d, i) => (
                      <div key={d.n} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm border-2 border-[#242424] dark:border-[#474747]"
                          style={{
                            backgroundColor: [
                              "#2b825b",
                              "#3b82f6",
                              "#f5b041",
                              "#db3a34",
                              "#808080",
                            ][i],
                          }}
                        />
                        <span className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]  font-medium">
                          {d.n} ({d.v}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>
            </div>
          )}

          {filter === "wallet" && (
            <ChartCard title="Wallet Funding vs Spending">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={walletData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#999999", fontWeight: 600 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#999999", fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      border: "2px solid #474747",
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  />
                  <Bar dataKey="funded" fill="#2b825b" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="spent" fill="#db3a34" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {filter === "invoices" && (
            <ChartCard title="Invoices Sent vs Paid">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={invoiceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#999999", fontWeight: 600 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#999999", fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      border: "2px solid #474747",
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  />
                  <Bar dataKey="sent" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="paid" fill="#2b825b" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {filter === "receipts" && (
            <ChartCard title="Receipts Issued & Value">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={receiptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#999999", fontWeight: 600 }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: "#999999", fontWeight: 600 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: "#999999", fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      border: "2px solid #474747",
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="issued"
                    stroke="#2b825b"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {filter === "contracts" && (
            <ChartCard title="Contract Status Breakdown">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer
                  width="100%"
                  height={220}
                  className="max-w-[260px]"
                >
                  <PieChart>
                    <Pie
                      data={contractPie}
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {contractPie.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#171717",
                        border: "2px solid #474747",
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3">
                  {contractPie.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm border-2 border-[#242424] dark:border-[#474747]"
                        style={{ backgroundColor: PIE_COLORS[i] }}
                      />
                      <span className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]  font-medium">
                        {d.name} ({d.value}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
