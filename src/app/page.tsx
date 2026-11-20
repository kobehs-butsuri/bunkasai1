"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { AccessBanner } from "@/components/access"
import CinematicTransition from "@/components/cinematic-transition"
import FixedHomeSlide from "@/components/fixed-home-slide"
import Footer from "@/components/footer"
import Hero from "@/components/hero"
import LatestNews from "@/components/latest-news"
import festivalData from "@/data/festival.json"
import { Day } from "@/data/types"

const Countdown = dynamic(() => import("../components/countdown"), { ssr: false })

const slideTitles = ["ホーム", "開催情報", "ニュース", "アクセス", "フッター"]

export default function Home() {
    const [label, setLabel] = useState<string | null>(null)
    const [targetDate, setTargetDate] = useState<Date | null>(null)
    const [ready, setReady] = useState(false)
    const [activeSlide, setActiveSlide] = useState(0)
    const heroRef = useRef<HTMLElement>(null)
    const heroVisualRef = useRef<HTMLDivElement>(null)
    const slidesRef = useRef<Array<HTMLElement | null>>([])

    useEffect(() => {
        // クライアントの暦日を使い、SSRとの日付境界のずれを避ける。
        const timeoutId = window.setTimeout(() => {
            const days = festivalData.festival.days as Day[]
            const now = new Date()
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
            const today = days.find((day) => day.date === todayStr)

            if (today) {
                setLabel(`きょうは${today.name}`)
                setTargetDate(null)
                setReady(true)
                return
            }

            const futureDays = days
                .map((day) => ({ ...day, dateObj: new Date(`${day.date}T00:00:00`) }))
                .filter((day) => day.dateObj > now)
                .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())

            if (futureDays.length > 0) {
                setLabel(null)
                setTargetDate(futureDays[0].dateObj)
                setReady(true)
                return
            }

            setLabel("創立記念祭は終了しました。")
            setTargetDate(null)
            setReady(true)
        }, 0)

        return () => window.clearTimeout(timeoutId)
    }, [])

    return (
        <>
            <div className="fixed inset-0 z-10 h-dvh w-screen overflow-hidden bg-background">
                <FixedHomeSlide
                    title={slideTitles[0]}
                    active={activeSlide === 0}
                    setRef={(element) => { slidesRef.current[0] = element }}
                >
                    <div className="absolute inset-x-0 bottom-0 top-16 bg-background md:top-20">
                        <Hero heroRef={heroRef} heroVisualRef={heroVisualRef} />
                    </div>
                </FixedHomeSlide>

                <FixedHomeSlide
                    title={slideTitles[1]}
                    active={activeSlide === 1}
                    setRef={(element) => { slidesRef.current[1] = element }}
                >
                    <div className="absolute inset-x-0 bottom-0 top-16 bg-background md:top-20">
                        <div className="m-4 flex h-[calc(100%-2rem)] items-center justify-center overflow-hidden bg-muted">
                            <div className="w-fit max-w-full px-4 py-6 md:px-8">
                                {ready && label && (
                                    <p className="mb-4 text-center text-xl font-bold text-accent-foreground">
                                        {label}
                                    </p>
                                )}

                                {ready && !label && targetDate && (
                                    <>
                                        <div className="mx-auto w-fit">
                                            <p className="text-right">
                                                <span className="text-[clamp(2rem,7vw,3.5rem)] font-bold text-accent-foreground">
                                                    創立記念祭
                                                </span>
                                                <br />
                                                <span className="text-2xl text-muted-foreground">まで</span>
                                            </p>
                                        </div>
                                        <div className="mx-auto flex w-fit items-end">
                                            <p className="p-2 text-center text-2xl text-muted-foreground md:text-4xl">あと</p>
                                            <Countdown
                                                date={targetDate}
                                                className="text-[clamp(3rem,14vw,8rem)] font-bold text-accent"
                                            />
                                            <p className="p-2 text-center text-2xl text-muted-foreground md:text-4xl">日</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </FixedHomeSlide>

                <FixedHomeSlide
                    title={slideTitles[2]}
                    active={activeSlide === 2}
                    setRef={(element) => { slidesRef.current[2] = element }}
                >
                    <div className="absolute inset-x-0 bottom-0 top-16 md:top-20">
                        <LatestNews compact />
                    </div>
                </FixedHomeSlide>

                <FixedHomeSlide
                    title={slideTitles[3]}
                    active={activeSlide === 3}
                    setRef={(element) => { slidesRef.current[3] = element }}
                >
                    <div className="absolute inset-x-0 bottom-0 top-16 md:top-20">
                        <AccessBanner compact />
                    </div>
                </FixedHomeSlide>

                <FixedHomeSlide
                    title={slideTitles[4]}
                    active={activeSlide === 4}
                    setRef={(element) => { slidesRef.current[4] = element }}
                >
                    <div className="absolute inset-x-0 bottom-0 top-16 md:top-20">
                        <Footer compact />
                    </div>
                </FixedHomeSlide>
            </div>

            <p aria-live="polite" className="sr-only">
                {slideTitles[activeSlide]}、{activeSlide + 1} / {slideTitles.length}
            </p>
            <CinematicTransition
                slidesRef={slidesRef}
                heroVisualRef={heroVisualRef}
                onActiveSlideChange={setActiveSlide}
            />
        </>
    )
}
