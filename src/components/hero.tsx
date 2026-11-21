"use client"

import {Logo} from "@/components/logo";
import Title from "@/components/logos/title.svg"
import type { RefObject } from "react"

interface HeroProps {
    heroRef: RefObject<HTMLElement | null>
    heroVisualRef: RefObject<HTMLDivElement | null>
}

export default function Hero({ heroRef, heroVisualRef }: HeroProps) {
    return (
      <section ref={heroRef} className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
          <div ref={heroVisualRef} className="relative z-10 flex items-center justify-center w-full h-full px-8 py-16">
                <span
                  data-intro="logo"
                  className="max-w-150 max-h-200 w-full h-full flex items-center justify-center"
                >
                    <Logo className="w-full h-full object-contain" />
                </span>
              <span data-intro="date" className="absolute top-4 left-8 font-bold text-background">
                    <span style={{ fontSize: 'clamp(2rem, 8vw, 4rem)' }}>5 / 3</span> <span className="text-xl">Sun.</span><br />
                    <span className="text-12">一般祭</span>
                </span>
              <span data-intro="title" className="select-none absolute bottom-4 left-8 font-bold mb-24 min-w-60 w-[40vw] max-w-90 pl-4">
                    <span className="text-xl">兵庫県立神戸高等学校</span><br />
                    <span style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>第130回</span>
                    <Title />
                </span>
          </div>
      </section>
    )
}