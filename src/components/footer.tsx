"use client"

import Link from "next/link";
import Instagram from '@/components/decoration/instagram.svg'
import Line from '@/components/decoration/line.svg'
import {Emblem, Logo} from "@/components/logo";
import useMobile from "@/hooks/use-mobile";

export default function Footer({ compact = false }: { compact?: boolean }) {
    const isMobile = useMobile()

    if (compact) {
        const linkGroups = [
            { title: "Pages", links: [{ href: "/", label: "ホーム" }, { href: "/introduce", label: "スローガン・ロゴ・エンブレム紹介" }] },
            { title: "イベント", links: [{ href: "/pickup", label: "Pick Up" }, { href: "/map", label: "マップ" }, { href: "/schedule", label: "スケジュール" }, { href: "/event", label: "イベント" }, { href: "/access", label: "アクセス" }] },
            { title: "情報", links: [{ href: "/access", label: "アクセス" }, { href: "/news", label: "ニュース" }, { href: "/policy", label: "サイトポリシー" }] },
            { title: "その他", links: [{ href: "/greeting", label: "ご挨拶" }, { href: "/faq", label: "よくあるご質問" }, { href: "/contact", label: "お問い合わせ" }] },
        ]

        return (
            <footer className="h-full w-full overflow-hidden bg-muted px-5 py-4 text-foreground md:px-8">
                <div className="mx-auto flex h-full max-w-7xl flex-col justify-center gap-4">
                    <div className="flex items-center gap-3 border-b border-foreground/20 pb-3">
                        <Emblem size={48} />
                        <Logo size={48} />
                        <div className="min-w-0">
                            <p className="text-lg font-bold text-primary">BOth</p>
                            <p className="text-xs text-primary">兵庫県立神戸高等学校</p>
                            <p className="text-[0.65rem] text-primary">神戸市灘区城の下通1丁目5-1</p>
                        </div>
                        <div className="ml-auto flex shrink-0 gap-2">
                            <Link href="https://lin.ee/Rw1wF2U" aria-label="LINE公式アカウント" className="p-1"><Line height={32} /></Link>
                            <Link href="https://instagram.com/kobe.souritsukinen.sai_130" aria-label="Instagram" className="p-1"><Instagram height={32} /></Link>
                        </div>
                    </div>
                    <nav aria-label="フッターナビゲーション" className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs md:grid-cols-4 md:gap-5">
                        {linkGroups.map((group) => (
                            <div key={group.title}>
                                <h2 className="mb-1 font-bold uppercase tracking-widest opacity-60">{group.title}</h2>
                                <ul className="space-y-1 opacity-80">
                                    {group.links.map((link) => (
                                        <li key={`${group.title}-${link.href}`}>
                                            <Link href={link.href} className="hover:opacity-100">{link.label}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>
            </footer>
        )
    }

    return (
        <footer className="w-full bg-muted text-foreground py-16 px-8 relative overflow-hidden select-none">
            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 pb-12 border-t-2 border-foreground border-opacity-20">
                    <div className="pt-12">
                        <p className="text-primary leading-relaxed text-2xl font-bold">BOth</p>
                        <div className={"flex gap-4"}>
                            <Emblem size={80} />
                            <Logo size={80} />
                        </div>
                        <p className={"text-primary leading-relaxed"}>兵庫県立神戸高等学校</p>
                        <p className={"text-primary leading-relaxed text-xs"}>神戸市灘区城の下通1丁目5-1</p>
                    </div>
                    {isMobile && (
                        <div className="pt-12 flex gap-2 md:justify-end h-fit">
                            <Link href="https://lin.ee/Rw1wF2U" className={"p-2"}><Line height={40}/></Link>
                            <Link href="https://instagram.com/kobe.souritsukinen.sai_130" className={"p-2"}><Instagram
                                height={40}/></Link>
                        </div>)}

                    <div className={"flex-row gap-4"}>
                        <div className="pt-12">
                            <ul className="space-y-2 text-sm opacity-80">
                                <h4 className="font-bold uppercase tracking-widest mb-4 text-sm opacity-60">Pages</h4>
                                <li>
                                    <Link href="/" className="hover:opacity-100 transition-opacity">
                                        ホーム
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/introduce" className="hover:opacity-100 transition-opacity">
                                        スローガン・ロゴ・エンブレム紹介
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div className="pt-12">
                            <ul className="space-y-2 text-sm opacity-80">
                                <h4 className="font-bold uppercase tracking-widest mb-4 text-sm opacity-60">イベント</h4>
                                <li>
                                    <Link href="/pickup" className="hover:opacity-100 transition-opacity">
                                        Pick Up
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/map" className="hover:opacity-100 transition-opacity">
                                        マップ
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/schedule" className="hover:opacity-100 transition-opacity">
                                        スケジュール
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/event" className="hover:opacity-100 transition-opacity">
                                        イベント
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/access" className="hover:opacity-100 transition-opacity">
                                        アクセス
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div className="pt-12">
                            <ul className="space-y-2 text-sm opacity-80">
                                <h4 className="font-bold uppercase tracking-widest mb-4 text-sm opacity-60">情報</h4>
                                <li>
                                    <Link href="/access" className="hover:opacity-100 transition-opacity">
                                        アクセス
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/news" className="hover:opacity-100 transition-opacity">
                                        ニュース
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/policy" className="hover:opacity-100 transition-opacity">
                                        サイトポリシー
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div className="pt-12">
                            <ul className="space-y-2 text-sm opacity-80">
                                <h4 className="font-bold uppercase tracking-widest mb-4 text-sm opacity-60">その他</h4>
                                <li>
                                    <Link href="/greeting" className="hover:opacity-100 transition-opacity">
                                        ご挨拶
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/faq" className="hover:opacity-100 transition-opacity">
                                        よくあるご質問
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/contact" className="hover:opacity-100 transition-opacity">
                                        お問い合わせ
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    {!isMobile && (
                        <div className="pt-12 flex gap-2 md:justify-end h-fit">
                            <Link href="https://lin.ee/Rw1wF2U" className={"p-2"}><Line height={40}/></Link>
                            <Link href="https://instagram.com/kobe.souritsukinen.sai_130" className={"p-2"}><Instagram
                                height={40}/></Link>
                        </div>)}
                </div>
            </div>
        </footer>
    )
}
