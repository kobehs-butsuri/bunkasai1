import type { ReactNode } from "react"

interface FixedHomeSlideProps {
    title: string
    active: boolean
    setRef: (element: HTMLDivElement | null) => void
    children: ReactNode
}

export default function FixedHomeSlide({ title, active, setRef, children }: FixedHomeSlideProps) {
    return (
        <section
            ref={setRef}
            aria-label={title}
            aria-hidden={!active}
            inert={!active}
            className="absolute inset-0 overflow-hidden bg-background"
            style={{ opacity: active ? 1 : 0, pointerEvents: active ? "auto" : "none" }}
        >
            {children}
        </section>
    )
}
