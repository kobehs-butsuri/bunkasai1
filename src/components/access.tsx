"use client"

import AccessMap from "@/components/access-map";
import useMobile from "@/hooks/use-mobile";
import Link from "next/link";
import {ChevronRight} from "lucide-react";

export function AccessTransportation({ compact = false }: { compact?: boolean }) {
    return (
        <div className={`${compact ? "space-y-2" : "space-y-4"} text-foreground/80`}>
            <div>
                <p className="font-semibold text-foreground mb-1">バス</p>
                <p>神戸市営バス 2/18/102系統 「神戸高校前」停留所から徒歩5分</p>
            </div>
            <div>
                <p className="font-semibold text-foreground mb-1">電車</p>
                <p>阪急神戸本線 「王子公園」駅から徒歩20分</p>
                <p>JR神戸線 「灘」駅から徒歩29分</p>
                <p>JR神戸線 「摩耶」駅から徒歩30分</p>
                <p>阪神本線 「岩屋」駅から徒歩35分</p>
                <p>阪神本線 「西灘」駅から徒歩35分</p>
            </div>
        </div>
    )
}

export function AccessBanner({ compact = false }: { compact?: boolean }) {
    const isMobile = useMobile()

    if (compact) {
        return (
            <section className="h-full w-full overflow-hidden bg-background px-5 py-4 md:px-10 md:py-6">
                <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-2 md:gap-10">
                    <div className="flex min-h-0 flex-col justify-center">
                        <h2 className="mb-3 text-3xl font-bold tracking-tight md:mb-5 md:text-4xl">
                            <Link href="/access" className="flex items-center">
                                アクセス <ChevronRight size={32} />
                            </Link>
                        </h2>
                        <div className="text-sm md:text-base">
                            <AccessTransportation compact />
                        </div>
                    </div>
                    <div className="flex min-h-0 items-center justify-center overflow-hidden">
                        <div className="max-h-[30dvh] w-full overflow-hidden md:max-h-full">
                            <AccessMap />
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <div className="bg-background pl-5 pr-5 pb-5 md:m-20">
        <div className="w-full">
            {/* Location Information */}
            {isMobile && (
                <div>
                    <div className="pb-8">
                        <div className="pt-8">
                                <h3
                                    className="text-4xl font-bold mb-4 tracking-tight text-balance"
                                    style={{letterSpacing: "0.05em"}}>
                                    <Link href="/access" className={"flex items-center"}>
                                        <span className={"text-4xl"}>アクセス</span>
                                        <ChevronRight size={36} />
                                    </Link>
                                </h3>
                        </div>
                        <AccessTransportation/>
                    </div>
                    <div className="pb-20">
                        <AccessMap/>
                    </div>
                </div>
                )
            }
            {!isMobile &&(
                <div className="grid grid-cols-2 gap-12">
                    <div className="p-8">
                        <div className="mb-12 pt-8">
                            <h3
                                className="font-bold mb-4 tracking-tight text-balance"
                                style={{letterSpacing: "0.05em"}}>
                                <Link href="/access" className={"flex items-center"}>
                                    <span className={"text-4xl"}>アクセス</span>
                                    <ChevronRight size={36} />
                                </Link>
                            </h3>
                        </div>
                        <AccessTransportation/>
                    </div>

                    <div className="flex items-center justify-center p-16">
                        <AccessMap/>
                    </div>
                </div>
                )
            }
        </div>
        </div>
    )
}
