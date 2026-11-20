"use client"

import Link from "next/link"
import { useMemo } from "react"
import newsData from "@/data/news.json"
import { CarouselSlider } from "@/components/carouselslider"

interface News {
    title: string
    date: string
    category: string
    content: string
}

function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

export default function LatestNews({ compact = false }: { compact?: boolean }) {
    const latestNews = useMemo(
        () =>
            (newsData.news as News[])
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((item, index) => ({
                    ...item,
                    id: `news-${String(index + 1).padStart(3, "0")}`,
                    formattedDate: formatDate(item.date),
                }))
                .reverse()
                .slice(0, 3),
        [],
    )

    const renderNewsCard = (item: typeof latestNews[0]) => (
        <Link key={item.id} href={`/news#${item.id}`} className="block h-full">
            <article
                className={`bg-card border border-accent-light ${compact ? "p-4" : "p-6"} hover:border-primary transition-all hover:shadow-lg h-full flex flex-col`}
            >
                <div className={compact ? "mb-2" : "mb-4"}>
                    <p className="text-xs font-bold opacity-75 mb-2">{item.formattedDate}</p>
                    <h3 className={`${compact ? "text-base mb-2" : "text-lg mb-3"} font-bold line-clamp-2 text-balance`}>{item.title}</h3>
                    <span className="text-xs inline-block text-background bg-accent-dark px-2 py-1">{item.category}</span>
                </div>
                <p className={`${compact ? "mb-2" : "mb-4"} text-sm text-muted-foreground line-clamp-3 grow`}>{item.content.replace(/<[^>]*>/g, "")}</p>
                <span className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                    詳細を見る →
                </span>
            </article>
        </Link>
    )

    return (
        <section className={`w-full max-w-7xl mx-auto ${compact ? "h-full overflow-hidden py-6 px-5 md:px-8" : "py-20 px-8"}`}>
            <div className={compact ? "mb-5" : "mb-12"}>
                <h2 className={`${compact ? "text-3xl mb-2" : "text-4xl mb-4"} font-bold tracking-tight text-balance`}>
                    ニュース
                </h2>
            </div>

            <div className={`md:hidden min-h-12 ${compact ? "max-h-full" : ""}`}>
                <CarouselSlider
                    items={latestNews}
                    renderItem={renderNewsCard}
                    aspectRatio="auto"
                />
            </div>

            <div className="text-center hidden md:block">
                    <div className={`grid text-start grid-cols-3 ${compact ? "gap-4 mb-4" : "gap-6 mb-8"}`}>
                    {latestNews.map((item) => (
                        renderNewsCard(item)
                    ))}
                </div>
                <Link
                    href="/news"
                    className={`inline-block text-primary px-8 ${compact ? "py-2" : "py-3"} font-bold hover:opacity-90 transition-opacity`}
                >
                    <div className={"relative flex"}>
                    すべてのニュースを見る
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 border-b-2 border-dashed border-primary"></div>
                    </div>
                </Link>
            </div>
        </section>
    )
}
