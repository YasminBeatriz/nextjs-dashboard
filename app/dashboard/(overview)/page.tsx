import { Suspense } from "react";

import { lusitana } from "@/app/ui/fonts";
import { fetchLatestInvoices } from "@/app/lib/data";
import RevenueChart from "../../ui/dashboard/revenue-chart";
import LatestInvoices from "../../ui/dashboard/latest-invoices";
import { RevenueChartSkeleton } from "@/app/ui/skeletons";
import CardWrapper from "../../ui/dashboard/cards";
import { CardsSkeleton } from "@/app/ui/skeletons";

const Page = async () => {
    const latestInvoices = await fetchLatestInvoices();

    return (
        <main>
            <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
                Dashboard
            </h1>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Suspense fallback={<CardsSkeleton />}>
                    <CardWrapper />
                </Suspense>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
                <Suspense fallback={<RevenueChartSkeleton />}>
                    <RevenueChart />
                </Suspense>
                <LatestInvoices latestInvoices={latestInvoices} />
            </div>
        </main>
    );
};

export default Page;
